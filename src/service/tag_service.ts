import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'

export default function make_tag_service(db_connection:PrismaClient){
    return Object.freeze({
        getTagsWithProducts
    });


    async function getTagsWithProducts(req:HttpRequest) {
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
                                language:{symbol:lang}
                            }
                        },
                        categories:{
                            include:{
                                fields:{
                                    where:{
                                        language:{
                                            symbol:lang
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
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await Promise.all(tagsData.map(async (tag)=>{
                tag.products.forEach(async(x)=>{
                    x.fields.forEach(async(field)=>{
                        x[field.fieldName]=field.fieldValue
                    })
                    x.categories.forEach(async(cat)=>{
                        cat.fields.forEach(async(field)=>{
                            cat[field.fieldName]=field.fieldValue
                        })
                        delete cat.fields
                    })
                    x.collection?.fields.forEach((field)=>{
                        x.collection[field.fieldName] = field.fieldValue
                    })
                    x.images?.forEach(async(image)=>{

                        image['url'] = image.image.url
                        delete image.image
                    })
                    delete x.collection?.fields
                    delete x.fields
                    return x;
                })
                return tag;
            }))
        }
    }

}