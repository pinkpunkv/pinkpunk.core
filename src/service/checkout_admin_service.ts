import { PrismaClient,DeliveryType, Prisma, CheckoutStatus, Address, CheckoutInfo, Field } from '@prisma/client'
import {Request, Response} from 'express'
import {AddressDto, CheckoutDTO, CheckoutInfoDTO} from '../model/dto'
import {RequestUser} from '../common/request_user'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import Decimal from 'decimal.js';
import { checkout_include } from './include/checkout'
import { CheckoutVariantInfo, CheckoutWithExtraInfo } from '@abstract/types'
import make_variant_service from './meant_service/variant'
import make_checkout_variant_service from './meant_service/checkout_variant'
import { plainToClass } from 'class-transformer'

export default function make_admin_checkout_service(db_connection:PrismaClient){
    let variant_service = make_variant_service(db_connection)
    let checkout_variant_service = make_checkout_variant_service(db_connection)
    
    return Object.freeze({
        update_checkout,
        create_checkout,
        get_checkouts,
        remove_variant_from_checkout,
        decrease_from_checkout,
        add_to_checkout,
        get_checkout_info,
        get_user_checkouts
    });

    async function get_checkout_variant_or_throw(checkout_id: string,variantId: number) {
        return await db_connection.checkoutVariants.findFirstOrThrow({
            where:{checkoutId:checkout_id, variantId: variantId},
            include:{
                variant:{
                    select:{
                        color: true,
                        count:true
                    }
                }
            }
        })
    }

    
    function map_checkout(checkout: any): any {
        checkout.total = 0;
        checkout.currencySymbol = "BYN";
        delete checkout.infoId;
        delete checkout.info?.id;
    
        let totalAmount = new Decimal(0);
    
        checkout.variants.forEach((item: any) => {
            const { variantId, variant, count } = item;
            const { product } = variant;
    
            item.id = variantId;
            item.product = { ...product, image: product.images[0]?.image };
            product.fields.forEach((field: Field) => item.product[field.fieldName] = field.fieldValue);
    
            checkout.total += count;
            totalAmount = totalAmount.add(new Decimal(count).mul(new Decimal(product.price)));
    
            item.maxCount = variant.count;
            item.size = variant.size;
            item.color = variant.color;
    
            delete item.variantId;
            delete item.checkoutId;
            delete item.variant;
            delete item.product.fields;
            delete item.product.images;
        });
    
        checkout.totalAmount = totalAmount;
        return checkout;
    }


    async function get_checkout_or_throw(lang: string, checkout_id: string) : Promise<CheckoutWithExtraInfo>{
        return await db_connection.checkout.findFirstOrThrow({
            where:{id:checkout_id},
            include: checkout_include.get_checkout_include(lang),
        }) as CheckoutWithExtraInfo
    }

    async function get_checkout_without_fields_or_throw(checkout_id: string) {
        return db_connection.checkout.findFirstOrThrow({
            where:{id:checkout_id},
            include:{
                variants:true,
                info:true,
                address:true
            }
        })
    }

    async function get_user_checkouts(req:Request, res: Response) {
        let {lang="ru",statuses="completed,pending,declined,preprocess",userId=""}= {...req.query}
        let statuses_ = statuses.split(",") as Prisma.Enumerable<CheckoutStatus>
        if (req.body.authenticated_user.is_anonimus||userId=="")
            return {
                status:StatusCodes.OK,
                message:"success",
                content: []
            }
        let checkouts = await db_connection.checkout.findMany({
            where:{
                userId:userId,
                status:{
                    in:statuses_
                }
            },
            include:checkout_include.get_checkout_include(lang)
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkouts.map(x=>map_checkout(x))
        })
    }
    
    async function create_checkout(req:Request, res: Response) {
        let {lang="ru"}= {...req.query}
        // console.log(req.body);
        
        // let {deliveryType = "pickup", status="pending", variants = []} = {...req.body}
        let checkout_dto = plainToClass(CheckoutDTO, req.body)
        let info_dto = checkout_dto.info
        let address_dto = checkout_dto.address
        
        let checkout_ = await db_connection.$transaction(async ()=>{
            for(let variant of checkout_dto.variants)
                await variant_service.move_count(variant.variantId, "decrement", variant.count)
            return await db_connection.checkout.create({
                data:{
                    status:checkout_dto.status,
                    deliveryType:checkout_dto.deliveryType,
                    address:address_dto?{
                        create:{
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
                        }
                    }:{},
                    variants: checkout_dto.variants.length>0?{
                        createMany: {
                            data: checkout_dto.variants
                        }
                    }:{},
                    info:info_dto?{
                        create:{
                            email:info_dto.email,
                            phone:info_dto.phone,
                            firstName:info_dto.firstName,
                            lastName:info_dto.lastName
                        }
                    }:{},
                },
                include:checkout_include.get_checkout_include(lang)
            })
        })
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout_)
        })
    }

    async function update_checkout(req:Request, res: Response) {
        let checkoutId = req.params["checkoutId"]
        let {lang="ru"}= {...req.query}

        // let {deliveryType = "pickup", status="pending", variants = []} = {...req.body}
        let checkout_dto = plainToClass(CheckoutDTO, req.body)
        let info_dto = checkout_dto.info
        let address_dto = checkout_dto.address
        let checkout = await get_checkout_without_fields_or_throw(checkoutId)

        let checkout_ = await db_connection.$transaction(async ()=>{

            for(let variant of checkout.variants)
                await variant_service.move_count(variant.variantId, "increment", variant.count)

            for(let variant of checkout_dto.variants)
                await variant_service.move_count(variant.variantId, "decrement", variant.count)

            let address = address_dto?await db_connection.address.upsert({
                where:{id: checkout.addressId || ""},
                create:{
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
                },
                update:{
                    mask:address_dto.mask,
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
                }
            }):null

            let info = info_dto?await db_connection.checkoutInfo.upsert({
                where:{id:checkout.infoId || -1},
                create:{
                    email:info_dto.email,
                    phone:info_dto.phone,
                    firstName:info_dto.firstName,
                    lastName:info_dto.lastName,
                    comment:info_dto.comment
                },
                update:{
                    // id:checkout.infoId,
                    email:info_dto.email,
                    phone:info_dto.phone,
                    firstName:info_dto.firstName,
                    lastName:info_dto.lastName,
                    comment:info_dto.comment
                }
            }):null

            return await db_connection.checkout.update({
                where:{
                    id:checkout!.id
                },
                data:{
                    addressId:address?address.id:null,
                    deliveryType:checkout_dto.deliveryType,
                    paymentType:checkout_dto.paymentType,
                    infoId:info?info.id:null,
                },
                include:checkout_include.get_checkout_include(lang)
            })
        })
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout_)
        })    
    }

    async function add_to_checkout(req:Request, res: Response) {
        let{checkoutId=""}={...req.params}
        let {variantId=0,lang="ru"} = {...req.query};

        let checkout = await get_checkout_or_throw(lang,checkoutId)
        let variant = await db_connection.variant.findFirstOrThrow({
            where:{ id: Number(variantId), deleted:false }
        })

        let ind = checkout.variants.findIndex(x=>x.variantId==variant.id)
        if (ind!=-1&&variant.count==checkout.variants[ind].count)
            return res.status(StatusCodes.OK).send({ 
                status:StatusCodes.OK, 
                message:"success", 
                content: map_checkout(checkout)
            })
        
        let checkoutVariant = await db_connection.$transaction(async()=>{
            await variant_service.move_count(checkoutVariant.variantId, "decrement", 1)

            return await db_connection.checkoutVariants.upsert({
                where:{
                    checkoutId_variantId:{ checkoutId:checkout.id, variantId:variant.id, }
                },
                create:{ 
                    checkoutId:checkout.id, variantId:variant.id 
                },
                update:{ 
                    count:{increment:1} 
                },
                include:{ 
                    variant:checkout_include.get_variant_include(lang) 
                }
            })
        })

        if (ind!=-1) checkout.variants[ind].count+=1;
        else checkout.variants.push(checkoutVariant as CheckoutVariantInfo)

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout)
        })
    }

    async function get_checkouts(req:Request, res: Response) {
        let{skip=0,take=20,lang="ru",statuses="completed,pending,declined,preprocess",orderBy='{"orderDate":"desc"}'}={...req.query}
        let [orderKey,orderValue] = Object.entries(JSON.parse(orderBy))[0]
        let statuses_ = statuses.split(",") as Prisma.Enumerable<CheckoutStatus>
        let checkouts = await db_connection.checkout.findMany({
            skip:Number(skip),
            take:Number(take),
            orderBy:{
                [orderKey]:orderValue
            },
            where:{
                status:{ in:statuses_ }
            },
            include:checkout_include.get_checkout_include(lang)
        })

        let total = await db_connection.checkout.aggregate({
            _count:true,
            where:{ status:{ in:statuses_ } }
        })
         
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content:{
                checkouts:checkouts.map(x=>map_checkout(x)),
                total:total
            }
        })
    }

    async function get_checkout_info(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        let checkout = await get_checkout_or_throw(lang,checkoutId)

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout)
        })
    }
    
    async function remove_variant_from_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await get_checkout_or_throw(lang, checkoutId)
        let checkoutVariant = await get_checkout_variant_or_throw(checkoutId,variantId);

        checkout = await db_connection.$transaction(async()=>{
            
            await variant_service.move_count(checkoutVariant.variantId, "increment", checkoutVariant.count)
            return await db_connection.checkout.update({
                where:{id:checkout.id},
                data:{
                    variants:{
                        delete:{
                            checkoutId_variantId:{ variantId: checkoutVariant.variantId, checkoutId:checkout.id }
                        }
                    }
                },
                include:checkout_include.get_checkout_include(lang)
            }) as CheckoutWithExtraInfo
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout)
        })
    }

    async function decrease_from_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await get_checkout_or_throw(lang,checkoutId)
        let checkoutVariant = await get_checkout_variant_or_throw(checkoutId,variantId);
        checkout = await db_connection.$transaction(async()=>{
            await variant_service.move_count(checkoutVariant.variantId, "increment", 1)
            return await db_connection.checkout.update({
                where:{id:checkout.id},
                data:{
                    variants:checkoutVariant.count==1?{
                        delete:{
                            checkoutId_variantId:{ variantId: Number(variantId), checkoutId:checkout.id }
                        }
                    }:{
                        update:{
                            where:{checkoutId_variantId: {variantId: checkoutVariant.variantId, checkoutId: checkout.id}},
                            data:{
                                count:{decrement:1}
                            }
                        }
                    }
                },
                include:checkout_include.get_checkout_include(lang)
            }) as CheckoutWithExtraInfo
        })
        
         
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout)
        })
    }
}