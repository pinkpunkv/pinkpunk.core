import { PrismaClient,Prisma } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import UserAttr from '../common/user_attr'
import { BaseError } from '../exception';

export default function make_address_service(db_connection:PrismaClient){
    return Object.freeze({
        getMyAddresses,
        createAddress,
        deleteAddress,
        updateAddress
    });
    async function getUserAdresses(user:UserAttr) {
        return await db_connection.address.findMany({
            where:{
                userId:user.id
            },
            include:{
              fields:true   
            }
        })
    }
    async function getUserAdress(addrId,user:UserAttr) {
        return await db_connection.address.findMany({
            where:{
                id:addrId,
                userId:user.isAnonimus?null:user.id
            },
            include:{
              fields:true   
            }
        })
    }
    async function getMyAddresses(req:HttpRequest) {
        if (req.user.isAnonimus)
            return {
                status:StatusCodes.OK,
                message:"success",
                content: []
            }
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await getUserAdresses(req.user)
        }
    }
    async function updateAddress(req:HttpRequest) {
        let addressId = req.params['addressId']
        let {mask="",firstName="", lastName="", company="",streetNumber="",apartments="", zipCode="", city="",country=""} = {...req.body} 
        if(await getUserAdress(addressId,req.user)==null)
            throw new BaseError(417,"address with this id not found",[]);
        let address = await db_connection.address.update({
            where:{
                id:addressId
            },
            data:{
                mask:mask,
                fields:{
                    deleteMany:{
                        addressId:addressId
                    },
                    create:{
                        apartments:apartments,
                        city:city,
                        type:"shipping",
                        company:company,
                        country:country,
                        firstName:firstName,
                        lastName:lastName,
                        streetNumber:streetNumber,
                        zipCode:zipCode
                    } as Prisma.AddressFieldsCreateWithoutAddressInput
                }
            },
            include:{
                fields:true
            }
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: address
        }
    }
    async function deleteAddress(req:HttpRequest) {
        let addressId = req.params['addressId']
        if(await getUserAdress(addressId,req.user)==null)
            throw new BaseError(417,"address with this id not found",[]);
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.address.delete({
                where:{
                    id:addressId
                },
                include:{
                    fields:true
                }
            })
        }
    }
    async function createAddress(req:HttpRequest) {
        let {mask="",firstName="", lastName="", company="", apartment="",comment="",building="", street="", zipCode="", city="",country=""} = {...req.body} 
        let address = await db_connection.address.create({
            data:{
                userId:req.user.id,
                mask: mask,
                fields:{
                    create:{
                        apartment:apartment,
                        street:street,
                        comment:comment,
                        building: building,
                        city:city,
                        type:"shipping",
                        company:company,
                        country:country,
                        firstName:firstName,
                        lastName:lastName,
                        zipCode:zipCode
                    } as Prisma.AddressFieldsCreateWithoutAddressInput
                },
            },
            include:{
                fields:true
            }
        })

        return {
            status:StatusCodes.OK,
            message:"success",
            content: address
        }
    }
}