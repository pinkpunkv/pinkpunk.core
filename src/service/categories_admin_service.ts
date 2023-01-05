import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
export default function make_admin_category_service(db_connection:PrismaClient){
    return Object.freeze({
        createCategory,
        getCategories,
        deleteCategory,
        updateCategory
    });

    async function createCategory(req:HttpRequest){
        let{fields={}[0],parentId=null,isMain=false,mainSliderImages=[]}={...req.body}
        let collection = await db_connection.category.create({
            data:{
                parentId:parentId,
                fields:{
                    create:fields
                },
                isMain:isMain,
                mainSliderImages:{
                    connect:mainSliderImages
                }
            },
            include:{
                fields:true,
                mainSliderImages:true
            }
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content:collection
        }
    }
    async function updateCategory(req:HttpRequest){
        let{id=-1}={...req.params}
        let{fields={}[0],parentId=null,isMain=false,mainSliderImages=[]}={...req.body}
        let category = await db_connection.category.findFirstOrThrow({
            where:{
                id:Number(id)
            },
            include:{
                fields:true,
                mainSliderImages:true
            }
        })
        let categoryData = await db_connection.category.update({
            where:{id:category.id},
            data:{
                parentId:parentId,
                fields:{
                    deleteMany:{id:{
                        in:category.fields.map(x=>x.id)
                    }},
                    create:fields
                },
                isMain:isMain,
                mainSliderImages:{
                    deleteMany:{
                        id:{
                            in:category.mainSliderImages.map(x=>x.id)
                        }
                    },
                    connect:mainSliderImages
                }
            },
            include:{
                fields:true,
                mainSliderImages:true
            }
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content:categoryData
        }
    }
    async function deleteCategory(req:HttpRequest){
        let{id=-1}={...req.params}
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content:await db_connection.category.delete({
                where:{
                    id:id
                }
            })
        }
    }

    async function getCategories(req:HttpRequest) {
        let {skip=0,take=10} = {...req.query};
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.category.findMany({
                include:{
                    fields:true,
                    
                },
                orderBy:{
                    id:"desc"
                },
                skip:Number(skip),
                take:Number(take)
            })
        }
    }

}