import { PrismaClient,Prisma, Cart, CartVariants } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import UserAttr from '../common/user_attr'
import Decimal from 'decimal.js';
import { BaseError } from '../exception';

export default function make_cart_service(db_connection:PrismaClient){
    
    return Object.freeze({
        add_to_cart,
        remove_from_cart,
        get_cart,
        decrease_from_cart
    });



    function get_include(lang: string){
        return {include:
            {
                variant:{
                    include:{
                        product:{
                            include:{
                                fields:{
                                    where:{
                                        language:{ 
                                            symbol:{equals: lang,mode: 'insensitive'}
                                        }
                                    }
                                },
                                
                                tags:true,
                                images:{
                                    // where:{
                                    //     isMain:true
                                    // },
                                    select:{
                                        image:{
                                            select:{
                                                url:true
                                            }
                                        }
                                    },
                                    orderBy:{
                                        number:"asc"
                                    },
                                }
                            }
                        },
                        color:true,
                        images:{
                            take:1
                        }
                    },
                },
            },
            where:{variant:{
                product:{
                    deleted:false
                }
            }},
            orderBy:{variantId:"desc"}
        } as Prisma.CartVariantsFindManyArgs
    }

    function map_cart_to_response(cart: any) {
        cart.total = 0;
        let totalAmount = new Decimal(0);

        for (const variantItem of cart.variants) {
            const { variantId, variant, count } = variantItem;
            const { product } = variant;

            variantItem.id = variantId;
            variantItem.product = { ...product, image: product.images[0]?.image };
            product.fields.forEach((field:any) => variantItem.product[field.fieldName] = field.fieldValue);

            cart.total += count;
            totalAmount = totalAmount.add(new Decimal(count).mul(new Decimal(product.price)));
            
            variantItem.maxCount = variant.count;
            variantItem.size = variant.size;
            variantItem.color = variant.color;

            delete variantItem.variantId;
            delete variantItem.cartId;
            delete variantItem.variant;
            delete variantItem.product.fields;
            delete variantItem.product.images;
        }

        cart.totalAmount = totalAmount;
        return cart;
    }

    async function get_user_cart(lang:string,cartId:string,user:UserAttr) : Promise<Cart & { variants: CartVariants[]; } | null>{
        return await db_connection.cart.findFirst({
            where:!user||user.is_anonimus?{id:cartId,user:null}:{user:{id:user.id}},
            include:{variants:get_include(lang) }
        })
    }
    async function get_cart_variants(cartId:string,variantId:number) {
        return await db_connection.cartVariants.findFirst({
            where:{cartId:cartId,variantId:Number(variantId),variant:{deleted:false}},
            include:{
                variant:{select:{count:true}}
            }
        })
    }
    async function create_cart(lang:string,user:UserAttr) {
        return await db_connection.cart.create({
            data:user.is_anonimus? {} :{ user: { connect: { id:user.id } } },
            include:{ variants: get_include(lang) }
        })
    }
    
    async function get_user_cart_without_variants(cartId:string,user:UserAttr) {
        return db_connection.cart.findFirst({
            where:!user||user.is_anonimus?
            {id:cartId,user:null}:{user:{id:user.id}}
        })
    }

    async function get_cart_with_variants(cart_id:string) {
        return await db_connection.cart.findFirst({
            where:{id:cart_id},
            include:{variants:true}
        })
    }
   
    async function get_cart(req:Request, res: Response) {
        let {lang="ru",cartId=""} = {...req.query};
        let cart = await get_user_cart(lang,cartId,req.body.authenticated_user);
        if (cart==null) {
            cart = await create_cart(lang,req.body.authenticated_user)
        }
        
        if(cart.id!=cartId){
            let unconnectedCart = await get_cart_with_variants(cartId);
            if(unconnectedCart!=null){
                let exists = cart.variants.map(x=>x.variantId);
                
                cart = await db_connection.cart.update({
                    where:{id:cart.id},
                    data:{
                        variants:{
                            createMany:{
                                data:unconnectedCart.variants.filter(x=>!exists.includes(x.variantId)).map(x=>{return{variantId:x.variantId}})
                            }
                        }
                    },
                    include:{variants:get_include(lang) }
                })
            }
        }
       
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }
    
    async function add_to_cart(req:Request, res: Response) {
        let{cartId=""}={...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let variant = await db_connection.variant.findFirstOrThrow({
            where:{id:Number(variantId), deleted:false}
        })
       
        let cart = await get_user_cart(lang,cartId,req.body.authenticated_user)
        if(cart==null) throw new BaseError(417,"cart with this id not found",[]);
            
        let cartVariant = await get_cart_variants(cart.id,variantId)
        console.log(cartVariant);
        
        if (cartVariant==null){
            //let cart  = await getUserCartWithoutVariants(variantsData.id,req.body.authenticated_user)
            cart = await db_connection.cart.update({
                where:{id:cart.id},
                data:{
                    variants:{ create: {variantId:variant.id} }
                },
                include:{variants:get_include(lang) }
            });
        }
        else{
            if(cartVariant.variant.count>=cartVariant.count+1){
                await db_connection.cartVariants.update({
                    where:{ variantId_cartId:{ cartId: cart.id, variantId: variant.id, } },
                    data:{ count:{ increment: 1 } }
                })
                let ind = cart.variants.findIndex(x=>x.variantId==variantId)
                cart.variants[ind].count+= 1;
            }
            
        }
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }

    async function remove_from_cart(req:Request, res: Response) {
        let {cartId=""} = {...req.params}
        let {variantId=0, lang="ru"} = {...req.query};
        let cart = await get_user_cart(lang,cartId, req.body.authenticated_user)

        if(cart==null)
            throw new BaseError(417,"cart with this id not found",[]);

        cart = await db_connection.cart.update({
            where:{id:cart.id},
            data:{
                variants:{
                    delete:{
                        variantId_cartId:{ variantId:Number(variantId), cartId:cart.id }
                    }
                }
            },
            include:{variants:get_include(lang) }
        })
         
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }

    async function decrease_from_cart(req:Request, res: Response) {
        let {cartId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let cart = await get_user_cart(lang,cartId, req.body.authenticated_user)
        if (cart == null) throw new BaseError(417,"cart with this id not found",[]);       
        let cartVariant = await get_cart_variants(cart.id, variantId)
       
        if(cartVariant!=null&&cartVariant.count==1){
            cart = await db_connection.cart.update({
                where:{id:cart.id},
                data:{
                    variants:{
                        delete:{
                            variantId_cartId:{ variantId:Number(variantId), cartId:cartId }
                        }
                    }
                },
                include:{variants:get_include(lang) }
            })
        }
        else{
            await db_connection.cartVariants.update({
                where:{
                    variantId_cartId:{ cartId:cart.id, variantId:Number(variantId), }
                },
                data:{ count:{decrement:1} }
            })
            let ind = cart.variants.findIndex(x=>x.variantId==variantId)
            cart.variants[ind].count-=1; 
        }
         
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }
}