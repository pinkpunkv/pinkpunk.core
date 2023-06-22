import { PrismaClient, Prisma, User } from '@prisma/client';
import { HttpRequest } from "../common";
import {config} from '../config';
import bcrypt from 'bcryptjs'
import {StatusCodes} from 'http-status-codes'
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_size_admin_service(db_connection:PrismaClient){

    return Object.freeze({
        getAllSizes
    })

    async function getAllSizes(req:HttpRequest){
        let sizes = await db_connection.size.findMany({})
        
        return {
            status: StatusCodes.OK,
            message:"success",
            content: sizes.map(x=>x.size)
        }
    }
}
