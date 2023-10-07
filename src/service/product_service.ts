import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';
import Decimal from 'decimal.js';

export default function make_client_product_service(db_connection:PrismaClient){
    return Object.freeze({
        getProducts,
        getProductsPathes,
        searchProducts,
        getProduct,
        getProductByPath,
        getFilters,
        wantTo
    });
    async function wantTo(req:HttpRequest) {
        let {email=null} = {...req.query}
        let {id=0} = {...req.params};
        if (email==null||email=="")
            throw new BaseError(417,"email is required",[]);
        
        let session = await  db_connection.sessions.create({data:{
            session:req.sessionID
        }})
        let want = await db_connection.want.findFirst({
            where:{
                email:email
            }
        })
        let wants = new Decimal(0)
        if (want==null)
        wants = (await db_connection.$transaction(async()=>{
            let now = new Date().toISOString()
            want = await db_connection.want.create({
                data:{
                    email:email,
                    updatedAt:now
                }
            })
            return await db_connection.product.update({
                where:{id:Number(id)},
                data:{
                    wants:{
                        increment:1
                    }
                }
            })
        })).wants
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content:{wants:wants}
        }  
        
    }
    async function searchProducts(req:HttpRequest){
        let{skip=0,take=5,search="",lang="ru"}={...req.query}

        let products = await db_connection.product.findMany({
            where:{
                deleted:false,
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
                    }
                }
            }
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
        return {
            status:StatusCodes.OK,
            message:"success",
            content:{
                products:products.map((x)=>mapProductToResponse(x)),
                categories:categories.map((cat)=>{
                    for (const field of cat.fields) {
                        cat[field.fieldName]=field.fieldValue
                    }
                    delete cat.fields
                    return cat;
                }),
                total:total._count
            }
        }
    }
    async function getFilters(req:HttpRequest) {
        class Prices{
            min:Number
            max:Number
        }
        let sizes = await db_connection.size.findMany({where:{variants:{some:{deleted:false}}}})
        let prices = await db_connection.$queryRaw<Prices[]>`SELECT min(price) as min,max(price)as max from "Product" p where p.deleted=false and active = true`
        let colors = await db_connection.color.findMany({where:{variants:{some:{deleted:false}}}})
        
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: {
                sizes:sizes.map(x=>x.size),
                colors:colors,
                min:prices[0].min,
                max:prices[0].max
            }
        }  
    }
    async function getProductByPath(req:HttpRequest) {
        let {path=''} = {...req.params};
        let{lang="ru"}={...req.query}
        
        let product = await db_connection.product.findFirstOrThrow({
            where:{
                deleted:false,
            
                fields:{
                  some:{
                    fieldName:"path",
                    fieldValue:"/"+path
                  }  
                },
                active:true
            },
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
                    select:{
                        image:{
                            select:{
                                url:true
                            }
                        },
                        isMain:true,
                        number:true
                    },
                    orderBy:{number:"asc"},
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
        })
        await db_connection.product.update({
            where:{id:product.id},
            data:{
                views:{
                    increment:1
                }
            }
        })
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: mapProductToResponse(product)
        }
    }
    async function getProductsPathes(req:HttpRequest){
        let{lang="ru"}={...req.query}
        return {
            status:StatusCodes.OK,
            message:"success",
            content:(await db_connection.product.findMany({
                where:{deleted:false},
                select:{
                    fields:{
                        where:{
                            fieldName:"path",
                            language:{
                                symbol:{
                                    equals:lang,
                                    mode: 'insensitive'
                                }
                            }
                        }
                    }
                }
            })).filter(x=>x.fields.length>0).map(x=> x.fields[0].fieldValue)
        }
    }
    async function getProducts(req:HttpRequest){
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
        });
    
        let total = await db_connection.product.aggregate({where:where,_count:true})
        return {
            status:StatusCodes.OK,
            message:"success",
            content:{
                products:products.map(x=>mapProductToResponse(x)),
                total: total._count
            }
        }
    }
    function mapProductToResponse(product){
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
    async function getProduct(req:HttpRequest){
        let {id=0} = {...req.params};
        let{lang="ru"}={...req.query}
        let res = await db_connection.$transaction(async()=>{
            let product = await db_connection.product.findFirstOrThrow({
                where:{
                    active:true,
                    id:Number(id)
                },
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
                        select:{
                            image:{
                                select:{
                                    url:true
                                }
                            },
                            isMain:true,
                            number:true
                        },
                        orderBy:{number:"asc"},
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
        
        
        // product.fields.forEach(async(field)=>{
        //     product[field.fieldName]=field.fieldValue

        // })
        // delete product.fields
        // product.categories.forEach(async(cat)=>{
        //     cat.fields.forEach(async(field)=>{
        //         cat[field.fieldName]=field.fieldValue
        //     })
        //     delete cat.fields
        // })
        // product.collection?.fields.forEach((field)=>{
        //     product.collection[field.fieldName] = field.fieldValue
        // })
        // product.images?.forEach((image)=>{
        //     image['url']=image.image.url
        //     delete image.image
        // })
        
        // delete product.collection?.fields
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: mapProductToResponse(res)
        }
    }
}