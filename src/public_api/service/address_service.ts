import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {RequestUser} from '../common/request_user'
import { BaseError } from '../exception';
import { AddressDto } from '../../model/dto';
import { plainToClass } from 'class-transformer';

export default function make_address_service(db_connection:PrismaClient){
    return Object.freeze({
        get_my_addresses,
        create_address,
        delete_address,
        update_address
    });

    async function get_user_adresses(user:RequestUser) {
        return await db_connection.address.findMany({
            where:{
                userId:user.id
            }
        })
    }
    
    async function get_user_adress(addr_id: string, user:RequestUser) {
        return await db_connection.address.findMany({
            where:{
                id:addr_id,
                userId:user.is_anonimus?null:user.id
            }
        })
    }

    async function get_my_addresses(req:Request, res: Response) {
        if (req.body.authenticated_user.is_anonimus)
            return res.status(StatusCodes.OK).send({
                status:StatusCodes.OK,
                message:"success",
                content: []
            })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await get_user_adresses(req.body.authenticated_user)
        })
    }

    async function update_address(req:Request, res: Response) {
        let addressId = req.params['addressId']
        let address_dto = plainToClass(AddressDto,req.body.address)
        if(await get_user_adress(addressId,req.body.authenticated_user)==null)
            throw new BaseError(417,"address with this id not found",[]);
        let address = await db_connection.address.update({
            where:{ id:addressId },
            data:{
                mask:address_dto.mask,
                userId:req.body.authenticated_user.id,
                apartment: address_dto.apartment,
                building: address_dto.building,
                city: address_dto.city,
                comment: address_dto.comment,
                company: address_dto.company,
                country: address_dto.country,
                firstName: address_dto.firstName,
                lastName: address_dto.lastName,
                street: address_dto.street,
                type: address_dto.type,
                zipCode: address_dto.zipCode
                // fields:{
                //     deleteMany:{ addressId:addressId },
                //     createMany:{ data: address_dto.fields } 
                // }
            }
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: address
        })
    }

    async function delete_address(req:Request, res: Response) {
        let address_id = req.params.addressId.toString()
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.address.delete({
                where:{ id:address_id }
            })
        })
    }
    
    async function create_address(req:Request, res: Response) {
        let address_dto = plainToClass(AddressDto,req.body.address)
        let address = await db_connection.address.create({
            data:{
                userId:req.body.authenticated_user.id,
                mask: address_dto.mask,
                apartment: address_dto.apartment,
                building: address_dto.building,
                city: address_dto.city,
                comment: address_dto.comment,
                company: address_dto.company,
                country: address_dto.country,
                firstName: address_dto.firstName,
                lastName: address_dto.lastName,
                street: address_dto.street,
                type: address_dto.type,
                zipCode: address_dto.zipCode
                // fields:{ createMany:{ data: address_dto.fields } },
            }
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: address
        })
    }
}