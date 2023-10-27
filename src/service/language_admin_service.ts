import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'

export default function make_language_admin_service(db_connection:PrismaClient){
    return Object.freeze({
        get_languages,
        create_language,
        update_language,
        delete_language
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
    async function create_language(req:Request, res: Response) {
        let{name=null,symbol=null,imageId=null}={...req.body}
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.create({
                data:{
                    symbol:symbol,
                    imageId:imageId,
                    name:name
                }
            })
        })
    }
    async function update_language(req:Request, res: Response) {
        let {id=0} = {...req.params};
        let{name=null,symbol=null,imageId=null}={...req.body}
        return res.status(StatusCodes.OK).send({
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
        })
    }
    async function delete_language(req:Request, res: Response) {
        let {id=0} = {...req.params};
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.delete({
                where:{id:Number(id)}
            })
        })
    }
}