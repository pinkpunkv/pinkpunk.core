import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import { HttpValidationException } from '../common';
import { ValidationErrorWithConstraints } from '@abstract/types';

export default function make_promo_service(db_connection:PrismaClient){
    return Object.freeze({
        use_promo
    });

    async function use_promo(req:Request, res: Response) {
        if (!req.query["promoCode"]) throw new HttpValidationException([new ValidationErrorWithConstraints({"promoCode":"field i srequired"})])
        let code = req.query["promoCode"]!.toString()
        let checkoutId = req.params["checkoutId"]
        let checkout = 
        await db_connection.promoCode.findFirstOrThrow({
            where:{
                code: code
            }
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.language.findMany({
                include:{
                    image:true
                }
            })
        })
    }
}