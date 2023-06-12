import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
export default function make_category_service(db_connection:PrismaClient){
    return Object.freeze({
        getCategories,
        getMainCategoriesWithProductImages,
        getFiltersInfo
    });


    async function getCategories(req:HttpRequest) {
        let {lang="ru",parentId=null} = {...req.query};
        
        let categories;
        if(parentId!=null)
        categories = await db_connection.category.findMany({
            where:{
                parentId:parentId,
                active:true
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
            where:{active:true},
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
            content:categories.map((cat)=>{
                cat.fields.forEach(x=>{
                    cat[x.fieldName] = x.fieldValue
                })
                delete cat.fields
                return cat
            })
        }
    }
    async function getFiltersInfo() {
        let filters = await db_connection.product.groupBy({
            by:["sex"],
            where:{active:true},
            _count:{
                _all:true
            }    
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: filters.map((fil)=>{
                
                fil['count'] = fil._count._all 
                delete fil._count
                return fil
            })
        }
    }
    async function getMainCategoriesWithProductImages(req:HttpRequest) {
        let {lang="ru"} = {...req.query};
        console.log(lang);
        
        let categories = await db_connection.category.findMany({
            where:{
                isMain:true,
                active:true
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