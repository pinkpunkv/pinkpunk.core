import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'

export default function make_wish_list_service(db_connection:PrismaClient){
    return Object.freeze({
        addWish,
        removeFromWish,
        getWish
    });

    async function getWish(req:HttpRequest) {
        let {skip=0,take=10,lang="ru",wishListId=null} = {...req.query};
        if (wishListId==null) return {
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
        let wishList = await db_connection.wishList.findFirstOrThrow({
            where:req.user.isAnonimus?{
                id:Number(wishListId),
                user:null
            }:{
                user:{
                    id:req.user.id
                }
            },
            include:{
                products:{
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
                    },
                    take:take,
                    skip:skip
                }
            }
            
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: wishList.products.map(x=>{
                x.fields.forEach(async(field)=>{
                    x[field.fieldName]=field.fieldValue
                })
                delete x.fields
                return x
            })
        }
    }
    async function addWish(req:HttpRequest) {
        let{wishListId=null}={...req.params}
        let {productId=0} = {...req.query};
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.wishList.update({
                where:{
                    id:Number(wishListId)
                },
                data:{
                    products:{
                        connect:[{id:Number(productId)}]
                    }
                }
            })
        }
    }
    async function removeFromWish(req:HttpRequest) {
        let{wishListId=null}={...req.params}
        let {products=[]} = {...req.query};
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.cart.update({
                where:{
                    id:Number(wishListId)
                },
                data:{
                    variants:{   
                        disconnect:products.map(x=>{return {id:Number(x)}})
                    }
                }
            })
        }
    }
}