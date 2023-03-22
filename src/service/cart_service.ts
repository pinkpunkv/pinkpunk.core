import { PrismaClient,Prisma, Cart, CartVariants } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import UserAttr from '../common/user_attr'
import Decimal from 'decimal.js';
import { BaseError } from '../exception';

export default function make_cart_service(db_connection:PrismaClient){
    
    return Object.freeze({
        addToCart,
        removeFromCart,
        getCart,
        decreaseCountFromCart
    });



    function getInclude(lang){
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
                                    where:{
                                        isMain:true
                                    },
                                    select:{
                                        image:{
                                            select:{
                                                url:true
                                            }
                                        }
                                    },
                                    take:1
                                }
                            }
                        },
                        images:{
                            take:1
                        }
                    },
                },
            },
            orderBy:{variantId:"desc"}
        } as Prisma.CartVariantsFindManyArgs
    }

    function mapCartToResponse(cart) {
        cart.total = 0;
        let totalAmount = new Decimal(0);
        for (const x of cart['variants']) {
            x.id=x.variantId
            x.product = x.variant.product
            x.images = x.variant.images
            for (const field of x.variant.product.fields) {
                x.product[field.fieldName]=field.fieldValue
            }
            for (const image of x.variant.product.images) {
                x.product['image'] = image.image;
            }
            cart.total+=x.count
            totalAmount = totalAmount.add(new Decimal(x.count).mul(new Decimal(x.product.price)))
            x.maxCount = x.variant.count
            x.size = x.variant.size
            x.color = x.variant.color
            delete x.variantId
            delete x.cartId
            delete x.variant
            delete x.product.fields
            delete x.product.images
        }
        cart.totalAmount = totalAmount;
        return cart;
    }

    async function getUserCart(lang,cartId,user:UserAttr) {
        return db_connection.cart.findFirst({
            where:!user||user.isAnonimus?
            {id:cartId,user:null}
            :
            {user:{id:user.id}},
            
            include:{variants:getInclude(lang) }
        })
    }
    async function getCartVariant(cartId,variantId) {
        return await db_connection.cartVariants.findFirst({
            where:{cartId:cartId,variantId:Number(variantId),variant:{deleted:false}},
            include:{
                variant:{
                    select:{
                        count:true
                    }
                }
            }
        })
    }
    async function createCart(lang,user:UserAttr) {
        return await db_connection.cart.create({
            data:user.isAnonimus?
            {}
            :
            {user:{connect:{id:user.id}}},
            include:{variants:getInclude(lang) }
        })
    }
    
    async function getUserCartWithoutVariants(cartId,user:UserAttr) {
        return db_connection.cart.findFirst({
            where:!user||user.isAnonimus?
            {id:cartId,user:null}
            :
            {user:{id:user.id}}
        })
    }

    async function getCartWithVariants(cartId) {
        return await db_connection.cart.findFirst({
            where:{id:cartId},
            include:{variants:true}
        })
    }
   
    async function getCart(req:HttpRequest) {
        let {lang="ru",cartId=""} = {...req.query};
        let cart = await getUserCart(lang,cartId,req.user);
        console.log(cart);
         
        if (cart==null) {
            cart = await createCart(lang,req.user)
        }
        
        if(cart.id!=cartId){
            let unconnectedCart = await getCartWithVariants(cartId);
            if(unconnectedCart!=null){
                let exists = cart.variants.map(x=>x.variantId);
                
                cart=await db_connection.cart.update({
                    where:{id:cart.id},
                    data:{
                        variants:{
                            createMany:{
                                data:unconnectedCart.variants.filter(x=>!exists.includes(x.variantId)).map(x=>{return{variantId:x.variantId}})
                            }
                        }
                    },
                    include:{variants:getInclude(lang) }
                })
            }
        }
       
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCartToResponse(cart)
        }
    }
    
    async function addToCart(req:HttpRequest) {
        let{cartId=""}={...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let variantsData = await getUserCart(lang,cartId,req.user)

        if(variantsData==null)
            throw new BaseError(417,"cart with this id not found",[]);
            
        let cartVariant = await getCartVariant(variantsData.id,variantId)
       
        if (cartVariant==null){
            //let cart  = await getUserCartWithoutVariants(variantsData.id,req.user)
            variantsData = await db_connection.cart.update({
                where:{id:variantsData.id},
                data:{
                    variants:{
                        create: {variantId:Number(variantId)}
                    }
                },
                include:{variants:getInclude(lang) }
            });
        }
        else{
            if(cartVariant.variant.count>=cartVariant.count+1){
                await db_connection.cartVariants.update({
                    where:{
                        variantId_cartId:{
                            cartId:variantsData.id,
                            variantId:Number(variantId),   
                        }
                    },
                    data:{
                        count:{increment:1}
                    }
                })
                let ind = variantsData.variants.findIndex(x=>x.variantId==variantId)
                variantsData.variants[ind].count+=1;
            }
            
        }
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCartToResponse(variantsData)
        }
    }

    async function removeFromCart(req:HttpRequest) {
        let {cartId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let variantsData = await getUserCart(lang,cartId,req.user)

        if(variantsData==null)
            throw new BaseError(417,"cart with this id not found",[]);

        variantsData = await db_connection.cart.update({
            where:{id:variantsData.id},
            data:{
                variants:{
                    delete:{
                        variantId_cartId:{
                            variantId:Number(variantId),
                            cartId:variantsData.id
                        }
                    }
                }
            },
            include:{variants:getInclude(lang) }
        })
         
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCartToResponse(variantsData)
        }
    }

    async function decreaseCountFromCart(req:HttpRequest) {
        let {cartId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let variantsData = await getUserCart(lang,cartId,req.user)
        let cartVariant = await getCartVariant(variantsData.id,variantId)
       
        if(cartVariant!=null&&cartVariant.count==1){
            variantsData = await db_connection.cart.update({
                where:{id:variantsData.id},
                data:{
                    variants:{
                        delete:{
                            variantId_cartId:{
                                variantId:Number(variantId),
                                cartId:cartId
                            }
                        }
                    }
                },
                include:{variants:getInclude(lang) }
            })
        }
        else{
            await db_connection.cartVariants.update({
                where:{
                    variantId_cartId:{
                        cartId:variantsData.id,
                        variantId:Number(variantId),   
                    }
                },
                data:{
                    count:{decrement:1}
                }
            })
            let ind = variantsData.variants.findIndex(x=>x.variantId==variantId)
            variantsData.variants[ind].count-=1; 
        }
         
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCartToResponse(variantsData)
        }
    }
}