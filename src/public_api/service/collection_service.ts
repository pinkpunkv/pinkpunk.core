import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
export default function make_collection_service(db_connection:PrismaClient){
    return Object.freeze({
        get_collection,
        get_collections
    });

    async function get_collection(req:Request, res: Response) {
        let {id=0} = {...req.params};
        let {lang="ru"}={...req.query};
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:db_connection.collection.findFirst({
                where:{
                    id:id
                },
                include:{
                    fields:{
                        where:{
                            language:{
                                symbol:{
                                    equals: lang,
                                    mode: 'insensitive'
                                }
                            }
                        }
                    }
                }
            })
        })
    }
    
    async function get_collections(req:Request, res: Response) {
        let {take=10,skip=0} = {...req.query};
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:db_connection.collection.findMany({
                include:{
                    fields:false
                },
                orderBy:{
                    id:"desc"
                },
                skip:Number(skip),
                take:Number(take),
            })
        })
    }

}