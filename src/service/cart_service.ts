import { PrismaClient,Prisma, Cart, CartVariants, Variant } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {RequestUser} from '../common/request_user'
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

    async function get_cart_by_id(lang:string,cartId:string) : Promise<Cart & { variants: CartVariants[]; } | null>{
        return await db_connection.cart.findFirst({
            where:{id:cartId},
            include:{variants:get_include(lang) }
        })
    }

    async function get_cart_by_id_or_throw(lang:string,cartId:string) : Promise<Cart & { variants: CartVariants[]; }>{
        return await db_connection.cart.findFirstOrThrow({
            where:{id:cartId},
            include:{variants:get_include(lang) }
        })
    }

    async function get_cart_variants(cartId:string,variantId:number):Promise<CartVariants&{variant:{count: number}} | null> {
        return await db_connection.cartVariants.findFirst({
            where:{cartId:cartId,variantId:Number(variantId),variant:{deleted:false}},
            include:{
                variant:{select:{count:true}}
            }
        })
    }
    
    async function get_variant_or_throw(variant_id: number):Promise<Variant> {
        return await db_connection.variant.findFirstOrThrow({
            where:{id: variant_id}
        })
    }

    async function create_cart(lang:string,user:RequestUser) {
        return await db_connection.cart.create({
            data:user.is_anonimus? {} :{ user: { connect: { id:user.id } } },
            include:{ variants: get_include(lang) }
        })
    }
    
    async function get_user_cart_without_variants(cartId:string,user:RequestUser) {
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
        let {lang="ru", cartId=""} = {...req.query};
        let cart = await get_cart_by_id(lang, cartId);

        if (cart==null) {
            cart = await create_cart(lang, req.body.authenticated_user)
        }
        
        if(cart.id!=cartId){
            let a_created_cart = await get_cart_with_variants(cartId);
            if(a_created_cart!=null){
                let exists = cart.variants.map(x=>x.variantId);
                
                cart = await db_connection.cart.update({
                    where:{id:cart.id},
                    data:{
                        variants:{
                            createMany:{
                                data:a_created_cart.variants.filter(x=>!exists.includes(x.variantId)).map(x=>{return{variantId:x.variantId}})
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
        let{cart_id=""}={...req.params}
        let {variantId=0, lang="ru"} = {...req.query};

        let variant = await db_connection.variant.findFirstOrThrow({
            where:{id:Number(variantId), deleted:false}
        })
       
        let cart = await get_cart_by_id_or_throw(lang, cart_id)
        // if(cart==null) throw new BaseError(417,"cart with this id not found",[]);
            
        let cart_variant = await get_cart_variants(cart.id,variantId)
        
        if (cart_variant==null){
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
            if(cart_variant.variant.count>=cart_variant.count+1){
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
        let {cart_id=""} = {...req.params}
       
        let {variantId=0, lang="ru"} = {...req.query};
        let cart = await get_cart_by_id_or_throw(lang, cart_id)
        let variant = await get_variant_or_throw(Number(variantId));
        cart = await db_connection.cart.update({
            where:{id:cart.id},
            data:{
                variants:{
                    delete:{
                        variantId_cartId:{ variantId:variant.id, cartId:cart.id }
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
        let {cart_id=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let variant = await get_variant_or_throw(Number(variantId));
        let cart = await get_cart_by_id_or_throw(lang,cart_id)   
        let cart_variant = await get_cart_variants(cart.id, variantId)
       
        if(cart_variant!=null&&cart_variant.count==1){
            cart = await db_connection.cart.update({
                where:{id:cart.id},
                data:{
                    variants:{
                        delete:{
                            variantId_cartId:{ variantId:variant.id, cartId:cart_id }
                        }
                    }
                },
                include:{variants:get_include(lang) }
            })
        }
        else{
            await db_connection.cartVariants.update({
                where:{
                    variantId_cartId:{ cartId:cart.id, variantId:variant.id, }
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