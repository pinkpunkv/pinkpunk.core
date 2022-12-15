import { PrismaClient } from "@prisma/client";
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
export default function make_product_service(db_connection:PrismaClient){
    return Object.freeze({
        getProducts,
        getProduct
    });
    async function getProducts(req:HttpRequest){
        let{skip=0,take=30}={...req.body}
        return {
            status:StatusCodes.OK,
            message:"success",
            content:db_connection.product.findMany({
                skip:skip,
                take:take,
                select:{
                    id:true,
                    images:true,
                    slug:true
                }
            })
        }
    }
    async function getProduct(req:HttpRequest){
        let id = {...req.body};
        db_connection.product.findFirst({
            where:{
                id:id
            }
        })
    }

}