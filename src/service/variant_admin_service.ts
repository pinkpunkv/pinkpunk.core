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
        let variantsData=[]
        await db_connection.$transaction(async()=>{
            return await variants.forEach(async x=>{
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
            })
        })
        
        
        return {
            status:StatusCodes.OK,
            message:"success", 
            content: variantsData
        }
    }
}