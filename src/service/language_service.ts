import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'

export default function make_language_service(db_connection:PrismaClient){
    return Object.freeze({
        get_languages
    });

    async function get_languages(req:Request, res: Response) {
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.findMany({
                include:{
                    image:true
                }
            })
        })
    }
}