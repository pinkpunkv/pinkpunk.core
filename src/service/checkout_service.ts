import { PrismaClient, DeliveryType, PaymentType, Address, CheckoutStatus, Token} from '@prisma/client'
import { Request, Response } from "express";

import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import {CustomerErrorCode, HttpValidationException} from '../common'
import { create_message_broker_connection } from '../helper';
import Decimal from 'decimal.js';
import {alpha_payment_service} from '../helper'
import {checkout_include} from './include/checkout'
import generateToken from '../utils/generate_token';
import {AddressDto, CheckoutClientUpdateDTO, CheckoutInfoDTO} from '../model/dto'
import { CheckoutVariantInfo, CheckoutWithExtraInfo, CheckoutWithInfo, ValidationErrorWithConstraints } from '@abstract/types';
import { order_delivery_type_validator } from '../helper/validator';
import { checkout_client_dto_mapper } from '@model/dto_mapper/checkout';
import { product_message_dto_mapper } from '@model/dto_mapper/product';
import { plainToClass } from 'class-transformer';
import { validate_dto_or_reject } from '../helper/validator/dto_validator';

function get_checkot_data(checkout: CheckoutWithExtraInfo):[number, Decimal, Decimal]{
    let total_products = 0;
    let base_total_amount = new Decimal(0);
        
    for (const checkout_variant of checkout.variants) {
        total_products+=checkout_variant.count;
        base_total_amount=base_total_amount.add(new Decimal(checkout_variant.variant.product.price).mul(new Decimal(checkout_variant.count)))
    }
    
    return [total_products, base_total_amount, checkout.promo?base_total_amount.mul(new Decimal(1).minus(checkout.promo.amount)):base_total_amount]
}

async function publish(checkout: CheckoutWithExtraInfo, token: Token) {
    let rconn = await create_message_broker_connection()
    let [tproducts, base_total_amout, total_amount] = get_checkot_data(checkout)
    await rconn.publish_order_info(
        "order",
        checkout!.info!.email, 
        token.token,
        "BY", 
        {
            orderId:checkout!.orderId,
            productsCount:tproducts,
            total:base_total_amout.toString(),
            deliveryPrice:"0",
            products: checkout.variants.map(x=>product_message_dto_mapper.from(x)),
            info:{
                contactFL:checkout.info!.firstName+" "+checkout!.info!.lastName,
                email:checkout.info!.email,
                phone:checkout.info!.phone,
                addressFL:checkout.address?checkout.address.firstName+" "+checkout!.address.lastName:"",
                address:checkout.address?`${checkout.address.street} ${checkout.address.apartment} ${checkout.address.building}`:"",
                postalCode:checkout.address?checkout.address.zipCode:"",
                city:checkout.address?checkout.address.city:"",
                country: checkout.address?checkout.address.country:""
            },
            discount:checkout.promo?checkout.promo.amount.toString():"0",
            finalTotal:total_amount.toString(),
        }
    )
}


export default function make_checkout_service(db_connection:PrismaClient){
    return Object.freeze({
        preprocess_checkout,
        update_checkout,
        remove_variant_from_checkout,
        decrease_from_checkout,
        add_to_checkout,
        get_checkout,
        pay_checkout,
        // place_order,
        update_checkout_status,
        use_promo
    });

    async function get_checkout_variant(checkout_id:string,variant_id:number) {
        return await db_connection.checkoutVariants.findFirst({
            where:{checkoutId:checkout_id,variantId:variant_id},
            include:{
                variant:{ select:{ count:true } }
            }
        })
    }

    async function get_checkout_variant_or_throw(checkout_id:string,variant_id:number) {
        return await db_connection.checkoutVariants.findFirstOrThrow({
            where:{checkoutId:checkout_id,variantId:variant_id},
            include:{
                variant:{ select:{ count:true } }
            }
        })
    }

    async function get_user_cart_or_throw(cart_id:string) {
        return db_connection.cart.findFirstOrThrow({
            where:{id:cart_id},
            include:{
                variants:{
                    where:{
                        variant:{
                            deleted:false
                        }
                    },
                    include:{
                        variant:{
                            include:{
                                product:true
                            }
                        }
                    },  
                }
            }
        })
    }

    async function get_checkout_or_throw(lang: string,checkout_id:string): Promise<CheckoutWithExtraInfo> {
        let checkout = await db_connection.checkout.findFirstOrThrow({
            where:{id:checkout_id},
            include:checkout_include.get_checkout_include(lang)
        })
        return checkout as CheckoutWithExtraInfo
    }
    
    async function get_checkout_by_status_or_throw(checkout_id:string, status: CheckoutStatus): Promise<CheckoutWithInfo> {
        return db_connection.checkout.findFirstOrThrow({
            where:{id:checkout_id,status:status},
            include:{
                variants:true,
                info:true,
                address:true
            }
        })
    }
    
    async function preprocess_checkout(req:Request, res: Response) {
        let {lang="ru",checkoutId="",cartId=""}= {...req.query}
        let cart = await get_user_cart_or_throw(cartId.toString())
        let checkout_ = await db_connection.$transaction(async ()=>{
            return await db_connection.checkout.upsert({
                where:{
                    id:checkoutId.toString()
                },
                create:{
                    status:'preprocess',
                    userId:req.body.authenticated_user.is_anonimus?null:req.body.authenticated_user.id,
                    variants:{
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                },
                update:{
                    variants:{
                        deleteMany:{
                            checkoutId:checkoutId
                        },
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                },
                include:checkout_include.get_checkout_include(lang)
            })
        })
        
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkout_client_dto_mapper.from(checkout_ as CheckoutWithExtraInfo)
        })
    }

    async function use_promo(req:Request, res: Response) {
        if (!req.body["code"]) throw new HttpValidationException([new ValidationErrorWithConstraints({"code":"field i srequired"})])
        let code = req.body["code"]!.toString()
        let checkoutId = req.params["checkoutId"]
        let checkout = await get_checkout_by_status_or_throw(checkoutId, "preprocess")
        let promo_code = await db_connection.promoCode.findFirstOrThrow({where:{code: code}})
        
        await db_connection.checkout.update({
            where:{id: checkout.id},
            data:{code: promo_code.code}
        })

        return res.status(StatusCodes.CREATED).send({
            status:StatusCodes.CREATED,
            message:"success",
            content: {}
        })
    }
    
    async function update_checkout(req:Request, res: Response) {
        let checkoutId = req.params["checkoutId"]
        let {lang = "ru"}= {...req.query}
        let checkout_info = plainToClass(CheckoutInfoDTO, req.body)
        let checkout_dto = await validate_dto_or_reject(plainToClass(CheckoutClientUpdateDTO, req.body))
        let address_data = req.body.address?plainToClass(AddressDto, req.body.address):null
       
        let checkout = await get_checkout_by_status_or_throw(checkoutId, "preprocess")
        
        if ((!address_data) && checkout_dto.deliveryType != "pickup")
            throw new BaseError(417,"address data is required",[]);

        let checkout_ = await db_connection.$transaction(async ()=>{
            let address = address_data?await db_connection.address.upsert({
                where:{id: checkout.addressId || undefined},
                create:{
                    userId:req.body.authenticated_user.id,
                    mask: address_data.mask,
                    apartment: address_data.apartment,
                    building: address_data.building,
                    city: address_data.city,
                    comment: address_data.comment,
                    company: address_data.company,
                    country: address_data.country,
                    firstName: address_data.firstName,
                    lastName: address_data.lastName,
                    street: address_data.street,
                    type: address_data.type,
                    zipCode: address_data.zipCode
                },
                update:{
                    mask:address_data.mask,
                    apartment: address_data.apartment,
                    building: address_data.building,
                    city: address_data.city,
                    comment: address_data.comment,
                    company: address_data.company,
                    country: address_data.country,
                    firstName: address_data.firstName,
                    lastName: address_data.lastName,
                    street: address_data.street,
                    type: address_data.type,
                    zipCode: address_data.zipCode
                }
            }):null
            let info = checkout_info?await db_connection.checkoutInfo.upsert({
                where:{id:checkout.infoId || undefined},
                create:{
                    email:checkout_info.email,
                    phone:checkout_info.phone,
                    firstName:checkout_info.firstName,
                    lastName:checkout_info.lastName,
                    comment:checkout_info.comment
                },
                update:{
                    // id:checkout.infoId,
                    email:checkout_info.email,
                    phone:checkout_info.phone,
                    firstName:checkout_info.firstName,
                    lastName:checkout_info.lastName,
                    comment:checkout_info.comment
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
            content: checkout_client_dto_mapper.from(checkout_ as CheckoutWithExtraInfo)
        })
    }

    async function add_to_checkout(req:Request, res: Response) {
        let { checkoutId="" } = {...req.params}
        let { variantId=0, lang="ru" } = {...req.query};
        let checkout = await get_checkout_or_throw(lang,checkoutId)
        let variant = await db_connection.variant.findFirstOrThrow({
            where:{ id: Number(variantId), deleted:false }
        })
        let ind = checkout.variants.findIndex(x=>x.variantId==variant.id)
        if (ind!=-1&&variant.count==checkout.variants[ind].count)
            return res.status(StatusCodes.OK).send({ 
                status:StatusCodes.OK, 
                message:"success", 
                content: checkout_client_dto_mapper.from(checkout)
            })
        
        let checkoutVariant = await db_connection.checkoutVariants.upsert({
            where:{
                checkoutId_variantId:{ checkoutId:checkout.id, variantId:variant.id, }
            },
            create:{
                checkoutId:checkout.id,
                variantId:variant.id
            },
            update:{
                count:{increment:1}
            },
            include:{ variant:checkout_include.get_variant_include(lang) }
        })
        
        if (ind!=-1)
            checkout.variants[ind].count+=1;
        else
            checkout.variants.push(checkoutVariant as CheckoutVariantInfo)
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkout_client_dto_mapper.from(checkout)
        })
    }

    async function get_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        let checkout = await get_checkout_or_throw(lang, checkoutId)
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkout_client_dto_mapper.from(checkout)
        })
    }

    async function remove_variant_from_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        
        let checkout = await get_checkout_or_throw(lang, checkoutId)

        let variant = await db_connection.checkoutVariants.findFirstOrThrow({
            where:{checkoutId:checkout.id, variantId:Number(variantId)}
        })

        await db_connection.checkout.update({
            where:{id:checkout.id},
            data:{
                variants:{
                    delete:{
                        checkoutId_variantId:{
                            variantId:variant.variantId,
                            checkoutId:checkout.id
                        }
                    }
                }
            }
        })
        checkout.variants.splice(checkout.variants.findIndex(x=>x.variantId==variant.variantId&&x.checkoutId==variant.checkoutId), 1)
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkout_client_dto_mapper.from(checkout)
        })
    }

    async function decrease_from_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await get_checkout_or_throw(lang,checkoutId)
        
        let checkout_variant = await get_checkout_variant_or_throw(checkoutId, Number(variantId));

        let ind = checkout.variants.findIndex(x=>x.variantId==variantId)
        if(checkout_variant.count==1){
            await db_connection.checkoutVariants.delete({
                where:{
                    checkoutId_variantId:{
                        checkoutId:checkout.id,
                        variantId:checkout_variant.variantId,   
                    }
                }
            })
            checkout.variants.splice(ind,1)
        }
        else{
            await db_connection.checkoutVariants.update({
                where:{
                    checkoutId_variantId:{
                        checkoutId:checkout.id,
                        variantId:checkout_variant.variantId,   
                    }
                },
                data:{
                    count:{decrement:1}
                }
            })
            checkout.variants[ind].count-=1; 
        }
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkout_client_dto_mapper.from(checkout)
        })
    }

    async function pay_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        
        let checkout = await get_checkout_or_throw(lang, checkoutId)
        await order_delivery_type_validator[checkout.deliveryType].validate_or_reject(checkout, [])

        if(checkout.status=="pending")
            return {
                status:StatusCodes.OK,
                message:"success",
                content: {
                    orderId:checkout.orderId
                }
            }

        let order_info = await db_connection.$transaction(async ()=>{
            let order_id = checkout.orderId
            let order_info: any = {}
            let total_amount = get_checkot_data(checkout)[2];
            let token = await db_connection.token.create({
                data:{ 
                    token:generateToken(),
                    type:"order",
                    objectId:checkout!.orderId.toString()
                }
            })
            if (checkout.paymentType == PaymentType.online){
                let order_status = await alpha_payment_service.get_payment_status(order_id.toString());
                if(order_status.data.orderStatus==2) return order_info
                order_id = Number(
                    (await db_connection.$queryRaw<{nextval:Number}[]>`SELECT nextval('"public"."Checkout_orderId_seq"')`)[0].nextval
                );
                let payres = await alpha_payment_service.create_payment(order_id.toString(), total_amount.mul(new Decimal(100)), token.token)
                if( payres.data.errorCode ) throw new BaseError(500, "something went wrong", payres.data);
                
                order_info.formUrl = payres.data.formUrl!
            }
            
            for(let checkout_variant of checkout.variants)
                await db_connection.variant.update({
                    where:{id:checkout_variant.variantId},
                    data:{
                        count:{
                            decrement: checkout_variant.count
                        }
                    }
                })

            await db_connection.checkout.update({
                where:{ id:checkout!.id },
                data:{
                    orderId: order_id,
                    status:"pending",
                    orderDate:new Date(),
                }
            })

            order_info.orderId = order_id
            await publish(checkout, token)
            return order_info;
        })
        
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: order_info
        })
    }

    async function update_checkout_status(req:Request, res: Response) {
        let {orderId=""} = {...req.params}
        let {lang="ru",ct=""} = {...req.query};
        let token = await db_connection.token.findFirst({
            where:{
                token:ct,
                type:"order"
            }
        })
        if(token==null) throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])

        let order_status = await alpha_payment_service.get_payment_status(orderId);
        let checkout = await db_connection.checkout.findFirstOrThrow({
            where:{
                orderId:Number(orderId)
            }
        })

        if(order_status.data.orderStatus==2){
            checkout = await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    status:"completed"
                },
                include:checkout_include.get_checkout_include(lang)
            })
        }
        else
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer, message:"unsuccessful payment status"}])


        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: {}
        })
    }
}