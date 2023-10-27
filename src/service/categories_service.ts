import { Field, PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
export default function make_category_service(db_connection:PrismaClient){
    return Object.freeze({
        get_categories,
        get_main_categories,
        get_filters_info
    });


    async function get_categories(req:Request, res: Response) {
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
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:categories.map((cat:any)=>{
                cat.fields.forEach((x:Field)=>{
                    cat[x.fieldName] = x.fieldValue
                })
                delete cat.fields
                return cat
            })
        })
    }
    async function get_filters_info() {
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
            content: filters.map((fil:any)=>{  
                fil['count'] = fil._count._all 
                delete fil._count
                return fil
            })
        }
    }
    async function get_main_categories(req:Request, res: Response) {
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

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: categories.map((cat:any)=>{
                cat.fields.forEach((x:Field)=>{
                    cat[x.fieldName] = x.fieldValue
                })
                delete cat.fields
                return cat;
            })
        })
    }
}