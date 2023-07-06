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
            distinct:['colorId','size'],
            include:{
                product:true,
                color:true
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
        productId = Number(productId)
        let res = await db_connection.$transaction(async()=>{
            let variantsData=[]
            let productVariants = await db_connection.variant.findMany({
                where:{
                    productId:productId
                }
            })
            for (let variant_data of variants) {
                variant_data.colorId = Number(variant_data.colorId)
                let productVariantInd = productVariants.findIndex(x=>variant_data.colorId==x.colorId&&variant_data.size==x.size)
                let size = await db_connection.size.findFirst({where:{size:variant_data.size}})
                if (size==null)
                    size = await db_connection.size.create({data:{size:variant_data.size}}) 
                if(productVariantInd!=-1)
                {
                    let variant = productVariants.at(productVariantInd)
                    variantsData.push(await db_connection.variant.update({
                        where:{
                            id:variant.id
                        },
                        data:{
                            colorId:variant_data.colorId,
                            productId:productId,
                            count:variant_data.count,
                            images:{
                                connect:variant_data.images
                            },
                            deleted:false
                        }
                    }))
                    productVariants.splice(productVariantInd,1)
                }
                else{
                    variantsData.push(await db_connection.variant.create({
                            data:{
                                size:size.size,
                                colorId:variant_data.colorId,
                                productId:productId,
                                count:variant_data.count,
                                images:{
                                    connect:variant_data.images
                                }
                            },
                            include:{
                                color:true
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