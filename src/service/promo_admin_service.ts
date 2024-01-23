import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import { HttpValidationException } from '../common';
import { PaginationParams, PaginationResponseWrapper, ValidationErrorWithConstraints } from '@abstract/types';
import { PromoDTO } from '@model/dto/promo';
import { plainToClass } from 'class-transformer';

export default function make_promo_admin_service(db_connection:PrismaClient){
    return Object.freeze({
        create,
        update,
        remove,
        get_all,
        get
    });

    async function get(req:Request, res: Response) {
        let code = req.params['code']
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.promoCode.findFirstOrThrow({
                where:{code:code},
            })
        })
    } 

    async function get_all(req:Request, res: Response) {
        let pagination_params = PaginationParams.parse(req.query)
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: new PaginationResponseWrapper(
                await db_connection.promoCode.findMany({
                    skip:pagination_params.skip,
                    take:pagination_params.take,
                }),
                pagination_params.require_total?(await db_connection.promoCode.aggregate({_count:true}))._count:0
            )
        })
    } 

    async function create(req:Request, res: Response) {
        let dto = await plainToClass(PromoDTO, req.body).validate()
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.promoCode.create({
                data:{
                    code: dto.code,
                    amount: dto.amount,
                    type: "multi"
                }
            })
        })
    }

    async function update(req:Request, res: Response) {
        let code = req.params['code']
        let dto = await plainToClass(PromoDTO, req.body).validate()
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.promoCode.update({
                where:{code:code},
                data:{
                    code: dto.code,
                    amount: dto.amount,
                    type: "multi"
                }
            })
        })
    }

    async function remove(req:Request, res: Response) {
        let code = req.params['code']
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.promoCode.delete({
                where:{code:code},
            })
        })
    }
}