import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'

export default function make_admin_product_service(db_connection:PrismaClient){
    return Object.freeze({
        getProducts,
        getProduct,
        createProduct,
        updateProduct,
        deleteProduct
    });

    async function getProducts(req:HttpRequest){
        let{skip=0,take=50}={...req.query}
        let products = await db_connection.product.findMany({
            skip:Number(skip),
            take:Number(take),
            orderBy:{
                id:"desc"
            },
            include:{
                fields:true,
                categories:true,
                variants:true,
                tags:true,
                collection:true,
                images:{
                    include:{
                        image:true
                    }
                },
                currency:true
            }
        });
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content:products
        }
    }
    async function getProduct(req:HttpRequest){
        let {id=0} = {...req.params};
        
        let product = await db_connection.product.findFirstOrThrow({
            where:{
                id:Number(id)
            },
            orderBy:{
                id:"desc"
            },
            include:{
                fields:true,
                categories:true,
                variants:true,
                tags:true,
                collection:true,
                images:{
                    include:{
                        image:true
                    }
                },
                currency:true
            }
        })
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: product
        }
    }

    async function createProduct(req:HttpRequest) {
        let {path=null,slug=null,collectionId=0,tags=[],categories={}[0],active=false, fields = [],images={}[0],currencySymbol=null,price=0,basePrice=0,sex='uni'} = {...req.body}
       
        return await db_connection.$transaction(async()=>{
            let tagsEntities = await db_connection.tag.findMany({
                where:{
                    tag:{
                        in:tags
                    }
                }
            })
            let tags_ = tagsEntities.map(x=>x.tag)
            await tags.filter(x=>!tags_.includes(x)).forEach(async (x)=>{
                tagsEntities.push(await db_connection.tag.create({
                    data:{
                        tag:x
                    }
                }))
            })
            let product = await db_connection.product.create({
                data:{
                    slug:slug,
                    categories:{
                        connect:categories.map(x=>{return { id:Number(x)}})
                    },
                    collectionId:collectionId,
                    fields:{
                        create:fields
                    },
                    tags:{
                        connect:tagsEntities
                    },
                    currencySymbol:currencySymbol,
                    price:Number(price),
                    basePrice:basePrice,
                    sex:sex,
                    active:active
                },
                include:{
                    categories:true,
                    fields:true,
                    tags:true,
                    variants:false,
                    images:{
                        include:{
                            image:true
                        }   
                    },
                    currency:true
                }
            })
            for (let image of images) {
               
                image.productId=product.id
            }
            await db_connection.productsImages.createMany({data:images})
            return {
                status:StatusCodes.OK,
                message:"success", 
                content: product
            }
        })
        
    }

    async function updateProduct(req:HttpRequest) {
        let {id=0} = {...req.params};
        let {slug=null,collectionId=null,tags=[],categories={}[0], fields = [],images={}[0],currencySymbol=null,price=0,sex="uni"} = {...req.body}
        
        return await db_connection.$transaction(async()=>{
            
            let productData = await db_connection.product.findFirstOrThrow({
                where:{id:Number(id)},
                include:{
                    fields:true
                }
            })
            let tagsEntities = await db_connection.tag.findMany({
                where:{
                    tag:{
                        in:tags
                    }
                }
            })
            let tags_ = tagsEntities.map(x=>x.tag)
            await tags.filter(x=>!tags_.includes(x)).forEach(async (x)=>{
                tagsEntities.push(await db_connection.tag.create({
                    data:{
                        tag:x
                    }
                }))
            })
            let product = await db_connection.product.update({
                where:{id:productData.id},
                data:{
                    slug:slug,
                    categories:{
                        connect:categories.map(x=>{return { id:Number(x)}})
                    },
                    collectionId:collectionId,
                    fields:{
                        deleteMany:{id:{
                            in:productData.fields.map(x=>x.id)
                        }},
                        create:fields
                    },
                    tags:{
                        connect:tagsEntities
                    },
                    images:{
                        deleteMany:{
                            productId:productData.id
                        },
                        createMany:{
                            data:images
                        }
                    },
                    price:Number(price),
                    currencySymbol:currencySymbol,
                    sex:sex
                },
                include:{
                    categories:true,
                    fields:true,
                    tags:true,
                    variants:false,
                    currency:true,
                    images:{
                        include:{
                            image:true
                        }   
                    }
                }
            })

            return {
                status:StatusCodes.OK,
                message:"success", 
                content: product
            }
        })
    }

    async function deleteProduct(req:HttpRequest) {
        let {id=0} = {...req.params};
        let product = await db_connection.product.delete({
            where:{id:Number(id)}
        })
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: product
        }
    }

}