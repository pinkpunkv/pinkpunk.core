import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import { S3 } from '@aws-sdk/client-s3';

export default function make_tag_admin_service(db_connection:PrismaClient){
    return Object.freeze({
        createTag,
        deleteTag,
        getTags
    });

    async function getTags(req:HttpRequest) {
        let {skip=0,take=10} = {...req.query};
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.tag.findMany({
                include:{
                    products:{
                        select:{
                            path:true
                        }
                    }
                },
                take:take,
                skip:skip
            })
        }
    }
    async function createTag(req:HttpRequest) {
        let{tag=null}={...req.body}
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.tag.create({
                data:{
                    tag:tag
                }
            })
        }
    }
    async function deleteTag(req:HttpRequest) {
        let{tag=null}={...req.params}
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.tag.delete({
                where:{
                    tag:tag
                }
            })
        }
    }
}