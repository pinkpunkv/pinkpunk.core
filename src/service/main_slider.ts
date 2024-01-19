import { Prisma, PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import { MainSliderData } from '../abstract/types';


export default function make_main_slider_service(db_connection:PrismaClient){
    return Object.freeze({
        get_setting_with_products,
        update_settings,
        get_settings,
    });

    function get_include(lang: string): Prisma.ProductInclude{
        return {
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
            },
            variants:{
                where:{
                    deleted:false
                },
                include:{
                    images:true,
                    color:true
                }
            }
        } 
    }
    
    async function get_setting_with_products(req:Request, res: Response) {
        let {lang="ru"}={...req.query}
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.mainSliderSettings.findFirstOrThrow({
                where:{id:1},
                include:{
                    products:{
                        include:get_include(lang)
                    }
                }
            })
        })
    }

    async function get_settings(req: Request, res: Response){
        let settings = await db_connection.mainSliderSettings.findFirst({where:{id:1}}) 
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: settings
        })
    }

    async function update_settings(req: Request, res: Response) {
        let new_settings = req.body as MainSliderData;
        let products = await db_connection.product.findMany({
            where:{
                id:{in:new_settings.products}
            }
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.mainSliderSettings.upsert({
                where:{id:1},
                update:{
                    mainButtonLink: new_settings.mainButtonLink,
                    mainButtonText: new_settings.mainButtonText,
                    subtitle: new_settings.subtitle,
                    subtitleButtonLink: new_settings.subtitleButtonLink,
                    subtitleButtonText: new_settings.subtitleButtonText,
                    subtitleDesc: new_settings.subtitleDesc,
                    title: new_settings.title,
                    title2: new_settings.title2,
                    products:{
                        set: products.map(x=>{return{id:x.id}})
                    }
                },
                create:{
                    id:1,
                    mainButtonLink: new_settings.mainButtonLink,
                    mainButtonText: new_settings.mainButtonText,
                    subtitle: new_settings.subtitle,
                    subtitleButtonLink: new_settings.subtitleButtonLink,
                    subtitleButtonText: new_settings.subtitleButtonText,
                    subtitleDesc: new_settings.subtitleDesc,
                    title: new_settings.title,
                    title2: new_settings.title2,
                    products:{
                        connect: products.map(x=>{return{id:x.id}})
                    }
                },
                include:{
                    products:true
                }
            })
        })
    }
}