import { PrismaClient, Prisma, User } from '@prisma/client';
import {Request, Response} from 'express'
import bcrypt from 'bcryptjs'
import {StatusCodes} from 'http-status-codes'
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_color_admin_service(db_connection:PrismaClient){

    return Object.freeze({
        get_colors,
        create_color,
        update_color,
        delete_color
    })

    async function get_colors(req:Request, res: Response){
        let{skip=0,take=20}={...req.query}
        let colors = await db_connection.color.findMany({
            skip:skip,
            take:take
        })
        let total = await db_connection.color.aggregate({
            _count:true
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: {
                colors:colors,
                total: total._count
            }
        })
    }
    async function create_color(req:Request, res: Response) {
        let {color="",colorText=""} = {...req.body}
        let colorData = await db_connection.color.create({
            data:{
                color:color,
                colorText:colorText
            }
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: colorData
        })
    }
    async function update_color(req:Request, res: Response) {
        let colorId = req.params['colorId']
        let {color="",colorText=""} = {...req.body}
        
        let colorData = await db_connection.color.update({
            where:{id: Number(colorId) },
            data:{
                color:color,
                colorText:colorText
            }
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: colorData
        })

    }

    async function delete_color(req:Request, res: Response) {
        let colorId = req.params['colorId']
        let colorData = await db_connection.color.delete({
            where:{id: Number(colorId) }
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: colorData
            
        })

    }
}
