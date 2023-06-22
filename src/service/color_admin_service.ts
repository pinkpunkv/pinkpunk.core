import { PrismaClient, Prisma, User } from '@prisma/client';
import { HttpRequest } from "../common";
import {config} from '../config';
import bcrypt from 'bcryptjs'
import {StatusCodes} from 'http-status-codes'
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_color_admin_service(db_connection:PrismaClient){

    return Object.freeze({
        getAllColors,
        createColor,
        updateColorInfo,
        deleteColor
    })

    async function getAllColors(req:HttpRequest){
        let{skip=0,take=20}={...req.query}
        let colors = await db_connection.color.findMany({
            skip:skip,
            take:take
        })
        let total = await db_connection.color.aggregate({
            _count:true
        })
        return {
            status: StatusCodes.OK,
            message:"success",
            content: {
                colors:colors,
                total: total._count
            }
        }
    }
    async function createColor(req:HttpRequest) {
        let {color="",colorText=""} = {...req.body}
        let colorData = await db_connection.color.create({
            data:{
                color:color,
                colorText:colorText
            }
        })

        return {
            status: StatusCodes.OK,
            message:"success",
            content: colorData
        }
    }
    async function updateColorInfo(req:HttpRequest) {
        let colorId = req.params['colorId']
        let {color="",colorText=""} = {...req.body}
        
        let colorData = await db_connection.color.update({
            where:{id: Number(colorId) },
            data:{
                color:color,
                colorText:colorText
            }
        })

        return {
            status: StatusCodes.OK,
            message:"success",
            content: colorData
        }

    }

    async function deleteColor(req:HttpRequest) {
        let colorId = req.params['colorId']
        let colorData = await db_connection.color.delete({
            where:{id: Number(colorId) }
        })
        return {
            status: StatusCodes.OK,
            message:"success",
            content: colorData
            
        }

    }
}
