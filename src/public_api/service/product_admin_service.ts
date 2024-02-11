import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'

export default function make_admin_product_service(db_connection:PrismaClient){
    return Object.freeze({
        get_products,
        get_product,
        create_product,
        update_product,
        delete_product
    });

    async function get_products(req:Request, res: Response){
        let{skip=0,take=50}={...req.query}
        let total = await db_connection.product.aggregate({
            _count:true
        })
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
                wants: true,
                currency:true
            }
        });
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:{
                total:total._count,
                products:products.map(x=>{
                    x.images.forEach(x=>{
                        return {id: x.imageId, ...x}
                    })
                    return x
                })
            }
        })
    }
    
    async function get_product(req:Request, res: Response){
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
                wants: true,
                currency:true
            }
        })
        product.images.forEach((x:any)=>{
            x['id']=x.imageId
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success", 
            content: product
        })
    }

    async function create_product(req:Request, res: Response) {
        let {path=null,slug=null,collectionId=0,tags=[],categories=[0],active=false, fields = [],images=[0],currencySymbol=null,price=0,basePrice=0,sex='uni'} = {...req.body}
       
        return await db_connection.$transaction(async()=>{
            let tagsEntities = await db_connection.tag.findMany({
                where:{
                    tag:{
                        in:tags
                    }
                }
            })
            let tags_ = tagsEntities.map(x=>x.tag)
            await tags.filter((x:string)=>!tags_.includes(x)).forEach(async (x:string)=>{
                tagsEntities.push(await db_connection.tag.create({
                    data:{
                        tag:x
                    }
                }))
            })
            let now = new Date().toISOString()
            let product = await db_connection.product.create({
                data:{
                    slug:slug,
                    categories:{
                        connect:categories.map((x:string)=>{return { id:Number(x)}})
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
                    createdAt:now,
                    updatedAt:now,
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
            product.images.forEach((x:any)=>{
                x['id']=x.imageId
                return x
            })
            return res.status(StatusCodes.OK).send({
                status:StatusCodes.OK,
                message:"success",
                content: product
            })
        })
        
    }

    async function update_product(req:Request, res: Response) {
        let {id=0} = {...req.params};
        let {slug=null,collectionId=null,tags=[],categories=[0],active=false, fields = [],images=[0],currencySymbol=null,basePrice=0,price=0,sex="uni"} = {...req.body}
        
        return await db_connection.$transaction(async()=>{
            
            let productData = await db_connection.product.findFirstOrThrow({
                where:{id:Number(id)},
                include:{
                    fields:true,
                    tags:true
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
            await tags.filter((x:string)=>!tags_.includes(x)).forEach(async(x:string)=>{
                tagsEntities.push(await db_connection.tag.create({
                    data:{
                        tag:x
                    }
                }))
            })
            let now = new Date().toISOString()
            let product = await db_connection.product.update({
                where:{id:productData.id},
                data:{
                    slug:slug,
                    categories:categories?{
                        connect:categories.map((x:string)=>{return { id:Number(x)}})
                    }:{},
                    collectionId:collectionId,
                    fields:{
                        deleteMany:{id:{
                            in:productData.fields.map((x:any)=>x.id)
                        }},
                        create:fields
                    },
                    tags:{
                        disconnect:productData.tags,
                        connect:tagsEntities
                    },
                    images:{
                        deleteMany:{
                            productId:productData.id
                        },
                        createMany:{
                            data:images.map((x:any)=>{return{imageId:x.id,number:x.number,isMain:x.isMain}})
                        }
                    },
                    basePrice:Number(basePrice),
                    active:active,
                    updatedAt:now,
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
            product.images.forEach((x:any)=>{
                x['id']=x.imageId
                return x
            })
            return res.status(StatusCodes.OK).send({
                status:StatusCodes.OK,
                message:"success",
                content: product
            })
        })
    }

    async function delete_product(req:Request, res: Response) {
        let {id=0} = {...req.params};
        let product = await db_connection.product.delete({
            where:{id:Number(id)}
        })
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success", 
            content: product
        })
    }

}