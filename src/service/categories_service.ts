import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
export default function make_category_service(db_connection:PrismaClient){
    return Object.freeze({
        getCategories,
        getMainCategoriesWithProductImages
    });


    async function getCategories(req:HttpRequest) {
        let {lang="ru",parentId=null} = {...req.query};
        
        let categories;
        if(parentId!=null)
        categories = await db_connection.category.findMany({
            where:{
                parentId:parentId
            },
            orderBy:{
                id:"desc"
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
                }
            }
        });
        else
        categories = await db_connection.category.findMany({
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
        });
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await Promise.all(categories.map(async(cat)=>{
                cat.fields.forEach(x=>{
                    cat[x.fieldName] = x.fieldValue
                })
                delete cat.fields
                return cat
            }))
        }
    }
    async function getMainCategoriesWithProductImages(req:HttpRequest) {
        let {lang="ru"} = {...req.query};
        console.log(lang);
        
        let categories = await db_connection.category.findMany({
            where:{
                isMain:true
            },
            orderBy:{
                id:"desc"
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
                mainSliderImages:true
            }
        })
        console.log(categories);
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: categories.map((cat)=>{
                cat.fields.forEach(x=>{
                    cat[x.fieldName] = x.fieldValue
                })
                delete cat.fields
                return cat;
            })
        }
    }
}