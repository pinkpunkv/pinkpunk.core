import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import { DATA_URL } from '../abstract/const';


export default function make_post_service(db_connection:PrismaClient){
    return Object.freeze({
        get_posts
    });

    async function get_posts(req:Request, res: Response) {
        
        //DATA_URL.expand({access:access})
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