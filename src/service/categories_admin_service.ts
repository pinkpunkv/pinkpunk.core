import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
export default function make_admin_category_service(db_connection:PrismaClient){
    return Object.freeze({
        create_category,
        get_categories,
        delete_category,
        update_category
    });

    async function create_category(req:Request, res: Response){
        let{fields=[0],parentId=null,isMain=false,mainSliderImages=[],active=false,slug=""}={...req.body}
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
                    connect:mainSliderImages.map((x:any)=>{return{id:x}})
                }
            },
            include:{
                fields:true,
                mainSliderImages:true
            }
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:category
        })
    }
    async function update_category(req:Request, res: Response){
        let{id=-1}={...req.params}
        let{fields=[0],parentId=null,isMain=false,mainSliderImages=[],active=false, slug=""}={...req.body}
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
                    create:fields.map((x:any)=>{return{"fieldName":x.fieldName,"fieldValue":x.fieldValue,"languageId":x.languageId}})
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
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:categoryData
        })
    }
    async function delete_category(req:Request, res: Response){
        let{id=-1}={...req.params}
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:await db_connection.category.delete({
                where:{
                    id:Number(id)
                }
            })
        })
    }

    async function get_categories(req:Request, res: Response) {
        let {skip=0,take=10} = {...req.query};
        return res.status(StatusCodes.OK).send({
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
        })
    }

}