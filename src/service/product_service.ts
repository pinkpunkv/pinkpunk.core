import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'

export default function make_client_product_service(db_connection:PrismaClient){
    return Object.freeze({
        getProducts,
        getProduct
    });

    async function getProducts(req:HttpRequest){
        console.log(req.query);
        
        let{skip=0,take=10,lang="ru",sex="",minPrice=0,maxPrice=Number.MAX_VALUE,categories=[],tags=[],sizes=[],orderBy='{"id":"desc"}'}={...req.query}
        let [orderKey,orderValue] = Object.entries(JSON.parse(orderBy))[0]
       
        let products = await db_connection.product.findMany({
            skip:Number(skip),
            take:Number(take),
            where:{
                sex:{
                    contains:sex
                },
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
                    every:{
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
                        size:{
                            in:sizes
                        }
                    }
                }:{}
            },
            orderBy:{
                [orderKey]:orderValue
            },
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
                images:true,
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
                delete x.collection?.fields
                delete x.fields
                return x;
            }))
        }
    }
    async function getProduct(req:HttpRequest){
        let {id=0} = {...req.params};
        let{lang="ru"}={...req.params}
        
        let product = await db_connection.product.findFirstOrThrow({
            where:{
                id:Number(id)
            },
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
            image['ur']=image.image.url
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