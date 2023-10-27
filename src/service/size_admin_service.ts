import { PrismaClient, Prisma, User } from '@prisma/client';
import {Request, Response} from 'express'
import {config} from '../config';
import bcrypt from 'bcryptjs'
import {StatusCodes} from 'http-status-codes'
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_size_admin_service(db_connection:PrismaClient){

    return Object.freeze({
        get_all_sizes
    })

    async function get_all_sizes(req:Request, res: Response){
        let sizes = await db_connection.size.findMany({})
        
        return {
            status: StatusCodes.OK,
            message:"success",
            content: sizes.map(x=>x.size)
        }
    }
}
