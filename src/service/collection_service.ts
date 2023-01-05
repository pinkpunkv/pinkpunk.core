import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
export default function make_collection_service(db_connection:PrismaClient){
    return Object.freeze({
        getCollection,
        getCollections
    });

    async function getCollection(req:HttpRequest) {
        let {id=0} = {...req.params};
        let {lang="ru"}={...req.query};
        return {
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
        }
    }
    
    async function getCollections(req:HttpRequest) {
        let {take=10,skip=0} = {...req.query};
        return {
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
        }
    }

}