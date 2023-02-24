import { PrismaClient, User } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import UserAttr from 'src/common/user_attr';

export default function make_wish_list_service(db_connection:PrismaClient){
    return Object.freeze({
        addWish,
        removeFromWish,
        getWish
    });
    async function getWishListData(lang,wishId,user:UserAttr) {
        return await db_connection.wishList.findFirst({
            where:user.isAnonimus?{
                id:Number(wishId),
                user:null
            }:{
                user:{
                    id:user.id
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
                    }
                }
            }
            
        })
    }
    async function getWishList(wishId) {
        return  await db_connection.wishList.findFirst({
            where:{
                id:wishId
            },
            include:{
                products:{
                    select:{
                        id:true
                    }
                }
            }
        })
    }

    async function getWish(req:HttpRequest) {
        let {lang="ru",wishId=null} = {...req.query};
        if (wishId==null) return {
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
        let wishList = await getWishListData(lang,wishId,req.user);
        if(wishList.id!=wishId){
            let exists = wishList.products.map(x=>x.id);
            let wish = await getWishList(wishId);
            wishList = await db_connection.wishList.update({
                where:{
                    id:wishList.id
                },
                data:{
                    products:{
                        connect:wish.products.filter(x=>!exists.includes(x.id))
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
                        }
                    }
                }
            })
        }
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
        let{lang="ru",wishId=null}={...req.params}
        let {productId=0} = {...req.query};
        let wishList = await getWishListData(lang,wishId,req.user);
        wishList = await db_connection.wishList.update({
            where:{
                id:wishList.id
            },
            data:{
                products:{
                    connect:[{id:Number(productId)}]
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
                    }
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
    async function removeFromWish(req:HttpRequest) {
        let{lang="ru",wishId=null}={...req.params}
        let {products=[]} = {...req.query};
        let wishList = await getWishListData(lang,wishId,req.user);
        wishList = await db_connection.wishList.update({
            where:{
                id:wishList.id
            },
            data:{
                products:{   
                    disconnect:products.map(x=>{return {id:Number(x)}})
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
                    }
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
}