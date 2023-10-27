import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'

export default function make_tag_service(db_connection:PrismaClient){
    return Object.freeze({
        get_tags_with_products
    });


    async function get_tags_with_products(req:Request, res: Response) {
        let{skip=0,take=10,tags=[],lang="ru"}={...req.query}
        let tagsData = await db_connection.tag.findMany({
            where:{
                tag:{in:tags}
            },
            include:{
                products:{
                    include:{
                        fields:{
                            where:{
                                language:{symbol:{
                                equals: lang,
                                mode: 'insensitive'
                            }}
                            }
                        },
                        categories:{
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
                                }
                            }
                        },
                        tags:true,
                        collection:{
                            include:{
                                fields:true
                            }
                        },
                        images:{
                            include:{
                                image:{
                                    select:{
                                        url:true
                                    }
                                } 
                            }
                        }
                    },
                    skip:skip,
                    take:take
                }
            }
        })
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await Promise.all(tagsData.map(async (tag:any)=>{
                tag.products.forEach(async(x:any)=>{
                    x.fields.forEach(async(field:any)=>{
                        x[field.fieldName]=field.fieldValue
                    })
                    x.categories.forEach(async(cat:any)=>{
                        cat.fields.forEach(async(field:any)=>{
                            cat[field.fieldName]=field.fieldValue
                        })
                        delete cat.fields
                    })
                    x.collection?.fields.forEach((field:any)=>{
                        x.collection[field.fieldName] = field.fieldValue
                    })
                    x.images?.forEach(async(image:any)=>{

                        image['url'] = image.image.url
                        delete image.image
                    })
                    delete x.collection?.fields
                    delete x.fields
                    return x;
                })
                return tag;
            }))
        })
    }

}