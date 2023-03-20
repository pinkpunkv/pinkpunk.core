import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import { Variant } from '@prisma/client';

export default function make_admin_variant_service(db_connection:PrismaClient){
    return Object.freeze({
        getVariantProducts,
        createVariantTemplate,
        getVariantsTemplates,
        addProductVariants,
        deteleVariantsTemplates
    });

    async function getVariantProducts(req:HttpRequest){
        let {id=0} = {...req.params};
        let variants = await db_connection.variant.findMany({
            where:{id:id},
            distinct:["color","size"],
            include:{
                product:true
            }
        });
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content:variants
        }
    }
    async function createVariantTemplate(req:HttpRequest){
        let {size = "",color=""} ={...req.body};
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: await db_connection.variantTemplate.create({
                data:{
                    size:size,
                    color:color
                }
            })
        }
    }
    async function getVariantsTemplates(req:HttpRequest){
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: await db_connection.variantTemplate.findMany({})
        }
    }
    async function deteleVariantsTemplates(req:HttpRequest){
        let ids:number[] = {...req.body} as any
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: await db_connection.variantTemplate.deleteMany({where:{id:{in:ids}}})
        }
    }

    async function addProductVariants(req:HttpRequest){
        let {productId=-1} = {...req.query};
        let variants = req.body['variants']
        
        let res = await db_connection.$transaction(async()=>{
            let variantsData=[]
            let productVariants = await db_connection.variant.findMany({
                where:{
                    productId:Number(productId)
                }
            })
            for (let x of variants) {
                let productVariantInd = productVariants.findIndex(y=>x.color==y.color&&x.size==y.size)
            
                if(productVariantInd!=-1)
                {
                    let variant = productVariants.at(productVariantInd)
                    variantsData.push(await db_connection.variant.update({
                        where:{
                            id:variant.id
                        },
                        data:{
                            size:x.size,
                            color:x.color,
                            productId:Number(productId),
                            count:x.count,
                            images:{
                                connect:x.images
                            },
                            deleted:false
                        }
                    }))
                    productVariants.splice(productVariantInd,1)
                }
                else{
                    variantsData.push(await db_connection.variant.create({
                            data:{
                                size:x.size,
                                color:x.color,
                                productId:Number(productId),
                                count:x.count,
                                images:{
                                    connect:x.images
                                }
                            },
                            select:{
                                images:true,
                                color:true,
                                count:true,
                                productId:true,
                                size:true
                            }
                        })
                    )
                }
            }
           
            await db_connection.variant.deleteMany({
                where:{
                    id:{
                        in:productVariants.map(x=>x.id)
                    }
                }
            })
            return variantsData;
        })
        
        
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: res
        }
    }
}