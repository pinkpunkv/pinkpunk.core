import { PrismaClient, User , Prisma} from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import UserAttr from 'src/common/user_attr';

import { BaseError } from '../exception';

export default function make_wish_list_service(db_connection:PrismaClient){
    return Object.freeze({
        addWish,
        removeFromWish,
        getWish
    });
    function mapToResponse(wishList){
        wishList.total = 0;
        wishList.products.forEach(x=>{
            wishList.total++
            x.fields.forEach((field)=>{
                x[field.fieldName]=field.fieldValue
            })
            x.images?.forEach((image)=>{
                x['image'] = image.image;
            })
            delete x.images
            delete x.fields
        })
        return wishList
    }
    function getInclude(lang) {
        return {
            where:{
                deleted:false   
            },
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
                    take:1
                }
            }
        } as Prisma.ProductFindManyArgs
    }
    async function createWishList(lang,user:UserAttr) {
        return  await db_connection.wishList.create({
            data:user.isAnonimus?{}:{
                user:{
                    connect:{
                        id:user.id
                    }
                }
            },
            include:{
                products:getInclude(lang)
            }
        })
    }
    async function getWishListData(lang,wishId,user:UserAttr) {
        
        return await db_connection.wishList.findFirst({
            where:user.isAnonimus?{
                id:wishId,
                user:null
            }:{
                user:{
                    id:user.id
                }
            },
            include:{
                products:getInclude(lang)
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
                    },
                    
                }
            }
        })
    }

    async function getWish(req:HttpRequest) {
        let {wishListId="",lang="ru"} = {...req.query}
        let wishList = await getWishListData(lang,wishListId,req.user);
        
        
        if (wishList==null) {
            wishList = await createWishList(lang,req.user);
        }
        
        if(wishList.id!=wishListId){
            let exists = wishList.products.map(x=>x.id);
            let wish = await getWishList(wishListId);
            if(wish!=null)
            wishList = await db_connection.wishList.update({
                where:{
                    id:wishList.id
                },
                data:{
                    products:{
                        connect:wish.products.filter(x=>!exists.includes(x.id)).map(x=>{return{id:x.id}})
                    }
                },
                include:{
                    products:getInclude(lang)
                }
            })
        }
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapToResponse(wishList)
        }
    }
    async function addWish(req:HttpRequest) {
        let{wishId=""}={...req.params}
        let {lang="ru",productId=0} = {...req.query};
        let wishList = await getWishListData(lang,wishId,req.user);
        if(wishList==null)
            throw new BaseError(417,"wish list with this id not found",[]);
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
                products:getInclude(lang)
            }
        })
       
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapToResponse(wishList)
        }
    }
    async function removeFromWish(req:HttpRequest) {
        let{wishId=""}={...req.params}
        let {lang="ru",productId=null} = {...req.query};
        let wishList = await getWishListData(lang,wishId,req.user);
        if(wishList==null)
            throw new BaseError(417,"wish list with this id not found",[]);
        wishList = await db_connection.wishList.update({
            where:{
                id:wishList.id
            },
            data:{
                products:{   
                    disconnect:{id:Number(productId)}
                }
            },
            include:{
                products:getInclude(lang)
            }
        })
    
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapToResponse(wishList)
        }
    }
}