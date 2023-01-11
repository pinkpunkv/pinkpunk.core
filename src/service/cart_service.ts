import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import { S3 } from '@aws-sdk/client-s3';

export default function make_cart_service(db_connection:PrismaClient){
    return Object.freeze({
        addToCart,
        removeFromCart,
        getCart
    });

    async function getCart(req:HttpRequest) {
        let {skip=0,take=10,lang="ru",cartId=null} = {...req.query};
        if (cartId==null) return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.cart.create({
                data:{

                },
                include:{
                    variants:true
                }
            })
        }
        let variants = await db_connection.cart.findFirstOrThrow({
            where:req.user.isAnonimus?{
                id:Number(cartId),
                user:null
            }:{
                user:{
                    id:req.user.id
                }
            },
            include:{
                variants:{
                    include:{
                        product:{
                            include:{
                                fields:{
                                    where:{
                                        language:{
                                            symbol:{
                                                equals: lang,
                                                mode: 'insensitive'
                                            }
                                        }
                                    }
                                },
                                tags:true
                            }
                        }
                    },
                    take:take,
                    skip:skip
                }
            }
            
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: variants.variants.map(x=>{
                x.product.fields.forEach(async(field)=>{
                    x.product[field.fieldName]=field.fieldValue
                })
                delete x.product.fields
                return x
            })
        }
    }
    async function addToCart(req:HttpRequest) {
        let{cartId=null}={...req.params}
        let {variantId=0} = {...req.query};
        let cart  = await db_connection.cart.findFirstOrThrow({
            where:req.user.isAnonimus?{
                id:Number(cartId),
                user:null
            }:{
                user:{
                    id:req.user.id
                }
            },
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.cart.update({
                where:{id:cart.id},
                data:{
                    variants:{
                        connect:[{id:Number(variantId)}]
                    }
                }
            })
        }
    }
    async function removeFromCart(req:HttpRequest) {
        let{cartId=null}={...req.params}
        let {variants=[]} = {...req.query};
        let cart  = await db_connection.cart.findFirstOrThrow({
            where:req.user.isAnonimus?{
                id:Number(cartId),
                user:null
            }:{
                user:{
                    id:req.user.id
                }
            },
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.cart.update({
                where:{id:cart.id},
                data:{
                    variants:{
                        
                        disconnect:variants.map(x=>{return {id:Number(x)}})
                    }
                }
            })
        }
    }
}