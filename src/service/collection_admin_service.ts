import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
export default function make_collection_admin_service(db_connection:PrismaClient){
    return Object.freeze({
        create_collection,
        get_collection,
        update_collection,
        get_collections,
        delete_collection
    });

    async function create_collection(req:Request, res: Response){
        let{fields=[0],products=[0]}={...req.body}
        let collection = await db_connection.collection.create({
            data:{
                fields:{
                    create:fields
                },
                products:{
                    connect:products
                }
            },
            include:{
                fields:true,
                products:true
            }
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:collection
        })
    }

    async function update_collection(req:Request, res: Response){
        let{id=-1}={...req.params}
        let{fields=[0],products=[0]}={...req.body}
        let collectionData = await db_connection.collection.findFirstOrThrow({
            where:{
                id:Number(id)
            },
            include:{
                fields:true,
                products:{
                    select:{
                        id:true,
                        collectionId:false
                    }
                }
            }
        })
        let collection = await db_connection.collection.update({
            where:{id:collectionData.id},
            data:{
                fields:{
                    deleteMany:{id:{
                        in:collectionData.fields.map(x=>x.id)
                    }},
                    create:fields     
                },
                products:{
                    disconnect:collectionData.products,
                    connect:products
                }
            },
            include:{
                fields:true,
                products:true
            }
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:collection
        })
    }
    async function delete_collection(req:Request, res: Response){
        let{id=-1}={...req.params}
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:await db_connection.collection.delete({
                where:{id:id}
            })
        })
    }
    async function get_collection(req:Request, res: Response) {
        let {id=0} = {...req.params};
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:db_connection.collection.findFirst({
                where:{
                    id:id
                },
                orderBy:{
                    id:"desc"
                },
                include:{
                    fields:true
                }
            })
        })
    }
    async function get_collections(req:Request, res: Response) {
        let {take=10,skip=0} = {...req.params};
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:db_connection.collection.findMany({
                include:{
                    fields:false
                },
                skip:Number(skip),
                take:Number(take),
            })
        })
    }

}