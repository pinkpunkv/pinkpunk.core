import { PrismaClient, Prisma, User } from '@prisma/client';
import { HttpRequest } from "../common";
import {config} from '../config';
import bcrypt from 'bcryptjs'
import {StatusCodes} from 'http-status-codes'
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_user_admin_service(db_connection:PrismaClient){

    return Object.freeze({
        getAllUsers,
        getUserInfo,
        updateUserInfo,
        updateUserStatus
    })

    async function findUniqueUser(where: Prisma.UserWhereUniqueInput,
        select?: Prisma.UserSelect) {
        return (await db_connection.user.findUnique({
            where,
            select,
          })) as User;
    }
    async function getAllUsers(req:HttpRequest){
        let{skip=0,take=20}={...req.query}
        let users = await db_connection.user.findMany({
            skip:skip,
            take:take
        })
        let total = await db_connection.user.aggregate({
            _count:true
        })
        return {
            status: StatusCodes.OK,
            message:"success",
            content: {
                users:users,
                total: total._count
            }
        }
    }
    async function updateUserStatus(req:HttpRequest) {
        let userId = req.params['userId']
        let status = req.query['status']
        let user = await db_connection.user.update({
            where:{id: userId },
            data:{
                status:status
            }
        })

        return {
            status: StatusCodes.OK,
            message:"success",
            content: user
        }
    }
    async function updateUserInfo(req:HttpRequest) {
        let userId = req.params['userId']
        let data ={
            firstName: req.body['firstName'],
            lastName: req.body['lastName'],
            phone: req.body['phone'],     
        }
        if(req.body['password']!=null)
            data['password'] = await bcrypt.hash(req.body['password'],config.SECRET)

        let user = await db_connection.user.update({
            where:{id: userId },
            data:data
        })
        // Sign Tokens
        
        return {
            status: StatusCodes.OK,
            message:"success",
            content: user
        }

    }

    async function getUserInfo(req:HttpRequest) {
        let userId = req.params['userId']
        let user = await findUniqueUser(
            { id: userId }
        );

        return {
            status: StatusCodes.OK,
            message:"success",
            content: user
            
        }

    }
}
