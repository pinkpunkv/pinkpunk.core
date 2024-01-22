import { Prisma, PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

interface Prices{
    min:Number
    max:Number
}

export default function make_client_product_service(db_connection:PrismaClient){
    return Object.freeze({
        get_popular_and_new_products,
        get_products_pathes,
        get_product_by_slug,
        search_products,
        get_products,
        get_product,
        get_filters,
        want_to
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
    async function want_to(req:Request, res: Response) {
        let {email=""} = {...req.query}
        let {id=0} = {...req.params};
        if (email==null||email=="")
            throw new BaseError(417,"email is required",[]);

        let want = await db_connection.want.findFirst({
            where:{
                email:email
            }
        })
        if (want==null)
        want = await db_connection.want.create({
            data:{
                productId: Number(id),
                email:email,
                updatedAt:new Date().toISOString()
            }
        })
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:{wants:want}
        }) 
    }

    async function search_products(req:Request, res: Response){
        let{skip=0,take=5,search="",lang="ru"}={...req.query}

        let products = await db_connection.product.findMany({
            where:{
                deleted: false,
                active: true,
                fields:{
                    some:{
                        fieldName:"name",
                        fieldValue:{
                            contains:search,
                            mode: 'insensitive'
                        }
                    }
                }
            },
            skip:skip,
            take:take,
            include:get_include(lang)
        });

        let categories = await db_connection.category.findMany({
            where:{
                fields:{
                    some:{
                        fieldName:"name",
                        fieldValue:{
                            contains:search,
                            mode: 'insensitive'
                        }
                    }
                }
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
        })
        let total = await db_connection.product.aggregate({
            _count:true, where:{
                deleted:false,
                active:true,
                fields:{
                    some:{
                        fieldName:"name",
                        fieldValue:{
                            contains:search,
                            mode: 'insensitive'
                        }
                    }
                }
            },
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:{
                products:products.map((x)=>map_product_to_response(x)),
                categories:categories.map((cat:any)=>{
                    for (const field of cat.fields) {
                        cat[field.fieldName]=field.fieldValue
                    }
                    delete cat.fields
                    return cat;
                }),
                total:total._count
            }
        })
    }
    
    async function get_filters(req:Request, res: Response) {
        let sizes = await db_connection.size.findMany({where:{variants:{some:{deleted:false}}}})
        let prices = await db_connection.$queryRaw<Prices[]>`SELECT min(price) as min,max(price)as max from "Product" p where p.deleted=false and active = true`
        let colors = await db_connection.color.findMany({where:{variants:{some:{deleted:false}}}})
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success", 
            content: {
                sizes:sizes.map(x=>x.size),
                colors:colors,
                min:prices[0].min,
                max:prices[0].max
            }
        })  
    }

    async function get_popular_and_new_products(req:Request, res: Response) {
        let{lang="ru"}={...req.query}
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success", 
            content: {
                new: await db_connection.product.findMany({
                    where:{deleted: false, active: true},
                    orderBy: {createdAt: "asc"},
                    include:get_include(lang),
                    take: 10
                }),
                hype: await db_connection.product.findMany({
                    where:{deleted: false, active: true},
                    orderBy: {views: "desc"},
                    include:get_include(lang),
                    take: 10
                })
            }
        })
    }

    async function get_product_by_slug(req:Request, res: Response) {
        let {slug=''} = {...req.params};
        let{lang="ru"}={...req.query}
        
        let product = await db_connection.product.findFirstOrThrow({
            where:{
                slug: slug,
                deleted:false,
                active:true
            },
            include:get_include(lang)
        })

        await db_connection.product.update({
            where:{id:product.id},
            data:{
                views:{
                    increment:1
                }
            }
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success", 
            content: map_product_to_response(product)
        })
    }



    async function get_products_pathes(req:Request, res: Response){
        let{lang="ru"}={...req.query}
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:(await db_connection.product.findMany({
                where:{deleted:false, active: true},
                select:{
                    slug: true
                }
            })).filter(x=>x.slug)
        })
    }

    async function get_products(req:Request, res: Response){
        let{skip=0,take=10,lang="ru",sex=[],minPrice=0,maxPrice=Number.MAX_VALUE,categories=[],tags=[],sizes=[],colors=[],orderBy='{"views":"desc"}'}={...req.query}
        let [orderKey,orderValue] = Object.entries(JSON.parse(orderBy))[0]
        
        colors = colors.filter(x=>x!=null&&x!=""&&!isNaN(x));
        let where = {
            deleted:false,
            active:true,
            sex:sex.length>0?{
                in:sex
            }:{},
            price:{
                gte:minPrice,
                lte:maxPrice
            },
            categories:categories.length>0?{
                some:{
                    id:{
                        in:categories.map(x=>Number(x))
                    }
                }
            }:{},
            tags:tags.length>0?{
                some:{
                    tag:{
                        in:tags
                    }
                }
            }:{},
            variants:sizes.length>0||colors.length>0?{
                some:{
                    AND:{
                        count:{
                            gt:0
                        }
                    },
                    size:sizes.length>0?{
                        in:sizes
                    }:{},
                    colorId:colors.length>0?{
                        in:colors.map(x=>Number(x))
                    }:{}
                }
            }:{}
        }
        let products = await db_connection.product.findMany({
            skip:Number(skip),
            take:Number(take),
            where:where,
            orderBy:{
                [orderKey]:orderValue
            },
            include:get_include(lang)
        });
    
        let total = await db_connection.product.aggregate({where:where,_count:true})
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:{
                products:products.map(x=>map_product_to_response(x)),
                total: total._count
            }
        })
    }
    function map_product_to_response(product:any){
        for (let field of product.fields) {
            product[field.fieldName]=field.fieldValue
        }
       
        if(product.categories)
        for (let cat of product.categories) {
            for (let field of cat.fields) {
                cat[field.fieldName]=field.fieldValue 
            }
            delete cat.fields
        }
        if(product.collection)
        for (let field of product.collection.fields) {
            product.collection[field.fieldName] = field.fieldValue
        }
        for (let image of product.images) {
            image['url'] = image.image.url;
            delete image.image
        }
        delete product.collection?.fields
        delete product.fields
        return product;
    }
    
    async function get_product(req:Request, res: Response){
        let {id=0} = {...req.params};
        let{lang="ru"}={...req.query}
        let result = await db_connection.$transaction(async()=>{
            let product = await db_connection.product.findFirstOrThrow({
                where:{
                    active:true,
                    id:Number(id)
                },
                include:get_include(lang)
            })
            await db_connection.product.update({
                where:{
                    id:product.id
                },
                data:{
                    views:{
                        increment:1
                    }
                }
            })
            return product;
        })
        

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success", 
            content: map_product_to_response(result)
        })
    }
}