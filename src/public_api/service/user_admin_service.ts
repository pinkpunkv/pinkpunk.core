import { PrismaClient, Prisma, User, StatusEnumType } from '@prisma/client';
import {Request, Response} from 'express'
import bcrypt from 'bcryptjs'
import {StatusCodes} from 'http-status-codes'
import { SECRET } from '../env';
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_user_admin_service(db_connection:PrismaClient){

    return Object.freeze({
        get_users,
        get_user_info,
        update_user_info,
        update_user_status
    })

    async function find_user(where: Prisma.UserWhereUniqueInput,
        select?: Prisma.UserSelect) {
        return (await db_connection.user.findUnique({
            where,
            select,
          })) as User;
    }
    async function get_users(req:Request, res: Response){
        let{skip=0,take=20}={...req.query}
        let users = await db_connection.user.findMany({
            skip:skip,
            take:take
        })
        let total = await db_connection.user.aggregate({
            _count:true
        })
        return res.status(StatusCodes.OK).send({
            status: StatusCodes.OK,
            message:"success",
            content: {
                users: users,
                total: total._count
            }
        })
    }
    async function update_user_status(req:Request, res: Response) {
        let userId = req.params.userId
        let status = req.query.status!.toString() as StatusEnumType
        let user = await db_connection.user.update({
            where:{id: userId },
            data:{
                status:status
            }
        })

        return res.status(StatusCodes.OK).send({
            status: StatusCodes.OK,
            message:"success",
            content: user
        })
    }
    async function update_user_info(req:Request, res: Response) {
        let userId = req.params.userId.toString()
        let data ={
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,    
            password:"" 
        }
        if(req.body['password']!=null)
            data.password = await bcrypt.hash(req.body.password, SECRET)

        let user = await db_connection.user.update({
            where:{id: userId },
            data:data
        })
        // Sign Tokens
        
        return res.status(StatusCodes.OK).send({
            status: StatusCodes.OK,
            message:"success",
            content: user
        })

    }

    async function get_user_info(req:Request, res: Response) {
        let userId = req.params['userId']
        let user = await find_user(
            { id: userId }
        );

        return res.status(StatusCodes.OK).send({
            status: StatusCodes.OK,
            message:"success",
            content: user
            
        })

    }
}
