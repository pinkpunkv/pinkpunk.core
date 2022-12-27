import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'

export default function make_language_service(db_connection:PrismaClient){
    return Object.freeze({
        getLanguages
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
}