import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import { S3 } from '@aws-sdk/client-s3';

export default function make_tag_admin_service(db_connection:PrismaClient){
    return Object.freeze({
        create_tag,
        delete_tag,
        get_tags
    });

    async function get_tags(req:Request, res: Response) {
        let {skip=0,take=10} = {...req.query};
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.tag.findMany({
               
                take:take,
                skip:skip
            })
        })
    }
    async function create_tag(req:Request, res: Response) {
        let{tag=null}={...req.body}
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.tag.create({
                data:{
                    tag:tag
                }
            })
        })
    }
    async function delete_tag(req:Request, res: Response) {
        let{tag=""}={...req.params}
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.tag.delete({
                where:{
                    tag:tag
                }
            })
        })
    }
}