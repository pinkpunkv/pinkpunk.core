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
        let{fields={}[0],parentId=null,isMain=false,mainSliderImages=[],active=false,slug=""}={...req.body}
        let parent = await db_connection.category.findFirst({
            where:{
                id:Number(parentId)
            }
        })
        
        
        let category = await db_connection.category.create({
            data:{
                slug:slug,
                parentId:parent?.id,
                fields:{
                    create:fields
                },
                active:active,
                isMain:isMain,
                mainSliderImages:{
                    connect:mainSliderImages.map(x=>{return{id:x}})
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
            content:category
        }
    }
    async function updateCategory(req:HttpRequest){
        let{id=-1}={...req.params}
        let{fields={}[0],parentId=null,isMain=false,mainSliderImages=[],active=false, slug=""}={...req.body}
        let category = await db_connection.category.findFirstOrThrow({
            where:{
                id:Number(id)
            },
            include:{
                fields:true,
                mainSliderImages:true
            }
        })
        let images = await db_connection.image.findMany({
            where:{
                id:{
                    in:mainSliderImages                    
                }
            }
        })
        let categoryData = await db_connection.category.update({
            where:{id:category.id},
            data:{
                slug:slug,
                parentId:parentId,
                fields:{
                    deleteMany:{id:{
                        in:category.fields.map(x=>x.id)
                    }},
                    create:fields.map(x=>{return{"fieldName":x.fieldName,"fieldValue":x.fieldValue,"languageId":x.languageId}})
                },
                active:active,
                isMain:isMain,
                mainSliderImages:images.length==0?{
                    deleteMany:{
                        id:{
                            in:category.mainSliderImages.map(x=>x.id)
                        }
                    },
                   
                }:{
                    deleteMany:{
                        id:{
                            in:category.mainSliderImages.map(x=>x.id)
                        }
                    },
                    connect:images.map(x=>{return {"id":x.id}})
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
                    id:Number(id)
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
                    mainSliderImages:true
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