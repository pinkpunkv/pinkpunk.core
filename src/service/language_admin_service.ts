import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'

export default function make_language_admin_service(db_connection:PrismaClient){
    return Object.freeze({
        getLanguages,
        createLanguage,
        updateLanguage,
        deleteLanguage
    });

    async function getLanguages(req:HttpRequest) {
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.findMany({
                include:{
                    image:true
                }
            })
        }
    }
    async function createLanguage(req:HttpRequest) {
        let{name=null,symbol=null,imageId=null}={...req.body}
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.create({
                data:{
                    symbol:symbol,
                    imageId:imageId,
                    name:name
                }
            })
        }
    }
    async function updateLanguage(req:HttpRequest) {
        let {id=0} = {...req.params};
        let{name=null,symbol=null,imageId=null}={...req.body}
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.update({
                where:{id:Number(id)},
                data:{
                    symbol:symbol,
                    imageId:imageId,
                    name:name
                }
            })
        }
    }
    async function deleteLanguage(req:HttpRequest) {
        let {id=0} = {...req.params};
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.delete({
                where:{id:Number(id)}
            })
        }
    }
}