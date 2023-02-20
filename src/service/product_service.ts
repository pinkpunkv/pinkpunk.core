import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'

export default function make_client_product_service(db_connection:PrismaClient){
    return Object.freeze({
        getProducts,
        getProductsPathes,
        searchProducts,
        getProduct,
        getProductByPath,
        getFilters
    });
    async function searchProducts(req:HttpRequest){
        let{skip=0,take=5,search="",lang="ru"}={...req.query}

        let products = await db_connection.product.findMany({
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
                variants:true
            }
        });
        return {
            status:StatusCodes.OK,
            message:"success",
            content:await Promise.all(products.map(async (x)=>{
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
                x.images?.forEach((image)=>{
                    image['url'] = image.image.url;
                    delete image.image
                })
                delete x.collection?.fields
                delete x.fields
                return x;
            }))
        }
    }
    async function getFilters(req:HttpRequest) {
        class SizesColors{
            sizes:String[]
            colors:String[]
        }
        class Prices{
            min:Number
            max:Number
        }
        let sc_s = await db_connection.$queryRaw<SizesColors[]>`SELECT array_agg(distinct size) as sizes,array_agg(distinct color)as colors  from "Variant" v`
        let prices = await db_connection.$queryRaw<Prices[]>`SELECT min(price) as min,max(price)as max from "Product" p`
        
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: {
                sizes:sc_s[0].sizes,
                colors:sc_s[0].colors,
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
                    include:{
                        images:true
                    }
                }
            }
        })
        product.fields.forEach(async(field)=>{
            product[field.fieldName]=field.fieldValue

        })
        delete product.fields
        product.categories.forEach(async(cat)=>{
            cat.fields.forEach(async(field)=>{
                cat[field.fieldName]=field.fieldValue
            })
            delete cat.fields
        })
        product.collection?.fields.forEach((field)=>{
            product.collection[field.fieldName] = field.fieldValue
        })
        product.images?.forEach((image)=>{
            image['url']=image.image.url
            delete image.image
        })
        delete product.collection?.fields
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: product
        }
    }
    async function getProductsPathes(req:HttpRequest){
        let{lang="ru"}={...req.query}
        return {
            status:StatusCodes.OK,
            message:"success",
            content:(await db_connection.product.findMany({
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
        let{skip=0,take=10,lang="ru",sex=[],minPrice=0,maxPrice=Number.MAX_VALUE,categories=[],tags=[],sizes=[],colors=[],orderBy='{"id":"desc"}'}={...req.query}
        let [orderKey,orderValue] = Object.entries(JSON.parse(orderBy))[0]
        
        let products = await db_connection.product.findMany({
            skip:Number(skip),
            take:Number(take),
            where:{
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
                variants:sizes.length>0?{
                    some:{
                        AND:{
                            count:{
                                gt:0
                            }
                        },
                        size:sizes.length>0?{
                            in:sizes
                        }:{},
                        color:colors.length>0?{
                            in:colors
                        }:{}
                    }
                }:{}
            },
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
                variants:true
            }
        });
        return {
            status:StatusCodes.OK,
            message:"success",
            content:await Promise.all(products.map(async (x)=>{
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
                x.images?.forEach((image)=>{
                    image['url'] = image.image.url;
                    delete image.image
                })
                delete x.collection?.fields
                delete x.fields
                return x;
            }))
        }
    }
    async function getProduct(req:HttpRequest){
        let {id=0} = {...req.params};
        let{lang="ru"}={...req.query}
        
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
                    include:{
                        images:true
                    }
                }
            }
        })
        product.fields.forEach(async(field)=>{
            product[field.fieldName]=field.fieldValue

        })
        delete product.fields
        product.categories.forEach(async(cat)=>{
            cat.fields.forEach(async(field)=>{
                cat[field.fieldName]=field.fieldValue
            })
            delete cat.fields
        })
        product.collection?.fields.forEach((field)=>{
            product.collection[field.fieldName] = field.fieldValue
        })
        product.images?.forEach((image)=>{
            image['url']=image.image.url
            delete image.image
        })
        delete product.collection?.fields
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: product
        }
    }
}