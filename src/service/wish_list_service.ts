import { PrismaClient, User , Prisma} from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {RequestUser} from '../common/request_user';

import { BaseError } from '../exception';

export default function make_wish_list_service(db_connection:PrismaClient){
    return Object.freeze({
        add_to_wishlist,
        remove_from_wishlist,
        get_wishlist
    });

    function map_to_response(wishList:any){
        wishList.total = 0;
        wishList.products.forEach((x:any)=>{
            wishList.total++
            x.fields.forEach((field:any)=>{
                x[field.fieldName]=field.fieldValue
            })
            x.images?.forEach((image:any)=>{
                x['image'] = image.image;
            })
            delete x.images
            delete x.fields
        })
        return wishList
    }

    function get_include(lang: string) {
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
                        image:{ select:{ url:true } }
                    },
                    orderBy:{ number:"asc" },
                    take:1
                }
            }
        } as Prisma.ProductFindManyArgs
    }

    async function _create(lang:string,user:RequestUser) {
        return  await db_connection.wishList.create({
            data:user.is_anonimus?{}:{
                user:{
                    connect: { id: user.id }
                }
            },
            include:{
                products: get_include(lang)
            }
        })
    }

    async function _get_data(lang:string,wishlist_id:string, user:RequestUser) {
        return await db_connection.wishList.findFirst({
            where:user.is_anonimus?{
                id:wishlist_id,
                user:null
            }:{
                user:{
                    id:user.id
                }
            },
            include:{
                products:get_include(lang)
            }
            
        })
    }

    async function get_wish_list(wishlist_id: string) {
        return  await db_connection.wishList.findFirst({
            where:{
                id:wishlist_id
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

    async function get_wishlist(req: Request, res: Response) {
        let {wishListId="",lang="ru"} = {...req.query}
        let wishList = await _get_data(lang, wishListId, req.body.authenticated_user);
    
        if (wishList==null) {
            wishList = await _create(lang,req.body.authenticated_user);
        }
        
        if(wishList.id!=wishListId){
            let exists = wishList.products.map(x=>x.id);
            let wish = await get_wish_list(wishListId);
            if(wish!=null)
            wishList = await db_connection.wishList.update({
                where:{
                    id: wishList.id
                },
                data:{
                    products:{
                        connect: wish.products.filter(x=>!exists.includes(x.id)).map(x=>{return{id:x.id}})
                    }
                },
                include:{
                    products: get_include(lang)
                }
            })
        }
        
        return res.status(StatusCodes.OK).send({
            status: StatusCodes.OK,
            message: "success",
            content: map_to_response(wishList)
        })
    }

    async function add_to_wishlist(req: Request, res: Response) {
        let{wishId = ""} = {...req.params}
        let {lang = "ru", productId=0} = {...req.query};
        let wishList = await _get_data(lang, wishId, req.body.authenticated_user);
        if(wishList == null)
            throw new BaseError(417,"wish list with this id not found",[]);
        wishList = await db_connection.wishList.update({
            where:{
                id: wishList.id
            },
            data:{
                products:{
                    connect:[ { id:Number(productId) } ]
                }
            },
            include:{
                products: get_include(lang)
            }
        })
       
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_to_response(wishList)
        })
    }
    
    async function remove_from_wishlist(req: Request, res: Response) {
        let{wishId=""}={...req.params}
        let {lang="ru", productId=null} = {...req.query};
        let wishList = await _get_data(lang,wishId, req.body.authenticated_user);
        if(wishList==null)
            throw new BaseError(417, "wish list with this id not found", []);
        wishList = await db_connection.wishList.update({
            where:{
                id: wishList.id
            },
            data:{
                products:{   
                    disconnect:{ id: Number(productId) }
                }
            },
            include:{
                products: get_include(lang)
            }
        })
    
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_to_response(wishList)
        })
    }
}