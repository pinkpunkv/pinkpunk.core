import { PrismaClient, DeliveryType, Prisma, PaymentType, 
    Address, CheckoutStatus, Checkout, Token, Field, 
    PromoCode, CheckoutVariants, AddressFields, CheckoutInfo, Variant, Product,
    Tag, Color, ProductsImages} from '@prisma/client'
import { Request, Response } from "express";

import {RequestUser} from '../common/request_user'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import {CustomerErrorCode, HttpValidationException} from '../common'
import { create_message_broker_connection } from '../helper';
import Decimal from 'decimal.js';
import {alpha_payment_service} from '../helper'

import generateToken from '../utils/generate_token';
import {AddressFieldDto, AddressDto} from '../model/dto'
import { CheckoutWithExtraInfo, CheckoutWithInfo, ProductMessageDto, ValidationErrorWithConstraints } from '@abstract/types';
import { order_delivery_type_validator } from '../helper/validator';
import { checkout_client_dto_mapper } from '@model/dto_mapper/checkout';
import { product_message_dto_mapper } from '@model/dto_mapper/product';

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
                addressFL:checkout.address!.fields[0].firstName+" "+checkout!.address!.fields[0].lastName,
                address:`${checkout.address!.fields[0].street} ${checkout!.address!.fields[0].apartment} ${checkout!.address!.fields[0].building}`,
                postalCode:checkout.address!.fields[0].zipCode,
                city:checkout.address!.fields[0].city,
                country: checkout.address!.fields[0].country
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
        place_order,
        update_checkout_status,
        use_promo,
        get_user_checkouts
    });

    async function get_checkout_variant(checkout_id:string,variant_id:number) {
        return await db_connection.checkoutVariants.findFirst({
            where:{checkoutId:checkout_id,variantId:variant_id},
            include:{
                variant:{
                    select:{
                        count:true
                    }
                }
            }
        })
    }

    async function get_user_cart(cart_id:string) {
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
            include:{
                variants:{ 
                    include:{ 
                        variant: {
                            include:{
                                product:{
                                    include:{
                                        fields:{
                                            where:{language:{ symbol:{equals: lang,mode: 'insensitive'}}}
                                        },
                                        tags:true,
                                        images:{
                                            select:{
                                                image:{
                                                    select:{
                                                        url:true
                                                    }
                                                }
                                            },
                                            take:1
                                        }
                                    }
                                },
                                color:true
                            }
                        }
                    }
                },
                info:true,
                address:{include:{fields:true}},
                promo: true
            },
        })
        return checkout
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

    async function get_checkout_by_status(checkout_id:string, status: CheckoutStatus): Promise<CheckoutWithInfo|null> {
        return db_connection.checkout.findFirst({
            where:{id:checkout_id,status:status},
            include:{
                variants:true,
                info:true,
                address:true
            }
        })
    }

    function get_include(lang: string) {
        return {
            include:{
                product:{
                    include:{
                        fields:{
                            where:{language:{ symbol:{equals: lang,mode: 'insensitive'}}}
                        },
                        tags:true,
                        images:{
                            select:{
                                image:{
                                    select:{
                                        url:true
                                    }
                                }
                            },
                            take:1
                        }
                    }
                },
                color:true
            },
        }  as Prisma.VariantFindManyArgs
    }

    function get_checkout_include(lang:string){
        return {
            variants:{ 
                include:{ 
                    variant: {
                        include:{
                            product:{
                                include:{
                                    fields:{
                                        where:{language:{ symbol:{equals: lang,mode: 'insensitive'}}}
                                    },
                                    tags:true,
                                    images:{
                                        select:{
                                            image:{
                                                select:{
                                                    url:true
                                                }
                                            }
                                        },
                                        take:1
                                    }
                                }
                            },
                            color:true
                        }
                    }
                }
            },
            info:true,
            address:{include:{fields:true}},
        } as Prisma.CheckoutInclude
    }
    
    async function get_user_checkouts(req:Request, res: Response) {
        let {lang="ru"}= {...req.query}
        if (req.body.authenticated_user.is_anonimus)
            return {
                status:StatusCodes.OK,
                message:"success",
                content: []
            }
        let checkouts = await db_connection.checkout.findMany({
            where:{
                userId:req.body.authenticated_user.id,
                status:{
                    in:["delivered","pending","completed"]
                }
            },
            include:get_checkout_include(lang)
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkouts.map(x=>checkout_client_dto_mapper.from(x as CheckoutWithExtraInfo))
        })
    }

    async function preprocess_checkout(req:Request, res: Response) {
        let {lang="ru",checkoutId="",cartId=""}= {...req.query}
        let exists = await db_connection.checkout.findFirst({where:{id:checkoutId}, select:{id:true}})
        let checkout_ = await db_connection.$transaction(async ()=>{
            let cart = await get_user_cart(cartId)
            return await db_connection.checkout.upsert({
                where:{
                    id:checkoutId
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
                        deleteMany:exists?{
                            checkoutId:exists.id
                        }:{},
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                },
                include:get_checkout_include(lang)
            })
        })
        
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkout_client_dto_mapper.from(checkout_ as CheckoutWithExtraInfo)
        })
    }

    async function use_promo(req:Request, res: Response) {
        if (!req.query["code"]) throw new HttpValidationException([new ValidationErrorWithConstraints({"code":"field i srequired"})])
        let code = req.query["code"]!.toString()
        let checkoutId = req.params["checkoutId"]
        let checkout = await get_checkout_by_status_or_throw(checkoutId, "preprocess")
        let promo_code = await db_connection.promoCode.findFirstOrThrow({
            where:{
                code: code
            }
        })
        
        await db_connection.checkout.update({
            where:{id: checkout.id},
            data:{
                code: promo_code.code
            }
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
        let {deliveryType = "pickup", email = "", phone = "", paymentType = "cash", firstName = "", lastName = "", comment = ""} = {...req.body}
        let address_data = req.body['address']?new AddressDto(req.body['address']):null
        let address_field = req.body['address']?new AddressFieldDto(req.body['address']):null

        let checkout = await get_checkout_by_status_or_throw(checkoutId, "preprocess")
        
        if ((!address_data || !address_field) && deliveryType != "pickup")
            throw new BaseError(417,"address data is required",[]);


        let address: Address | undefined;
        if (deliveryType!="pickup"&&address_data&&address_field)
            address = await db_connection.address.upsert({
                where:{
                    id:address_data.id
                },
                create:{
                    userId:req.body.authenticated_user.id,
                    mask: address_data.mask,
                    fields:{
                        create:address_field
                    },
                },
                update:{
                    mask:address_data.mask,
                    fields:address_data.id?{
                        deleteMany:{
                            addressId:address_data.id
                        },
                        create:address_field
                    }:{
                        create:address_field
                    }
                },
                include:{
                    fields:true
                }
            })
        
        // let address = await getUserAdress(addressId,req.body.authenticated_user)
        // if (address==null&&deliveryType!="pickup")
        //     throw new BaseError(417,"address not found",[]);
        
        
        let checkout_ = await db_connection.$transaction(async ()=>{
            return await db_connection.checkout.update({
                where:{
                    id:checkout!.id
                },
                data:{
                    address:address?{connect:{id:address?.id}}:{},
                    deliveryType:deliveryType as DeliveryType,
                    info:{
                        upsert:{
                            create:{
                                email:email,
                                phone:phone,
                                firstName:firstName,
                                lastName:lastName,
                                comment:comment
                            },
                            update:{
                                // id:checkout.infoId,
                                email:email,
                                phone:phone,
                                firstName:firstName,
                                lastName:lastName,
                                comment: comment
                            }
                        }
                    },
                    paymentType:paymentType as PaymentType
                },
                include:get_checkout_include(lang)
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
            where:{
                id: Number(variantId),
                deleted:false
            }
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
                checkoutId_variantId:{
                    checkoutId:checkout.id,
                    variantId:variant.id,   
                }
            },
            create:{
                checkoutId:checkout.id,
                variantId:variant.id
            },
            update:{
                count:{increment:1}
            },
            include:{
                variant:get_include(lang)
            }
        })
        
        if (ind!=-1)
            checkout.variants[ind].count+=1;
        else
            checkout.variants.push(checkoutVariant as any)
        
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
            where:{checkoutId:checkout.id, variantId:variantId}
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
        
        let checkout_variant = await get_checkout_variant(checkoutId, variantId);
        if(checkout_variant == null) throw new BaseError(417,"checkout variant with this id not found",[]);

        let ind = checkout.variants.findIndex(x=>x.variantId==variantId)
        if(checkout_variant.count==1){
            await db_connection.checkoutVariants.delete({
                where:{
                    checkoutId_variantId:{
                        checkoutId:checkout.id,
                        variantId:Number(variantId),   
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
                        variantId:Number(variantId),   
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

        if(checkout.info==null)
            throw new BaseError(417, "user details is required",[]);
        
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
                let payres = await alpha_payment_service.create_payment(order_id.toString(), total_amount, token.token)
                if( payres.data.errorCode ) throw new BaseError(500, "something went wrong", payres.data);
                
                order_info.formUrl = payres.data.formUrl!
            }

            await db_connection.checkout.update({
                where:{ id:checkout!.id },
                data:{
                    orderId: order_id,
                    status:"pending"
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

    async function place_order(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        
        let checkout = await get_checkout_or_throw(lang,checkoutId)
        
        // if(checkout.paymentType=="online")
        //     throw new BaseError(417,"invalid payment type",[]);
        
        if(checkout.status=="pending")
            return res.status(StatusCodes.CREATED).send({
                status:StatusCodes.OK,
                message:"success",
                content: {
                    orderId:checkout.orderId
                }
            })

        let [product_total, total_amount, base_total_amount] = get_checkot_data(checkout);
            
        let token = await db_connection.token.create({
            data:{ 
                token:generateToken(),
                type:"order",
                objectId:checkout.orderId.toString()
            }
        })

        let result = await db_connection.$transaction(async ()=>{ 
            await db_connection.checkout.update({
                where:{
                    id:checkout!.id
                },
                data:{
                    status:"pending"
                }
            })
            // let rconn = await create_message_broker_connection()
            // rconn.publish_order_info()
            await publish(checkout, token)
            return {orderId:checkout.orderId};
        })

        return res.status(StatusCodes.CREATED).send({
            status:StatusCodes.CREATED,
            message:"success",
            content: result
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
        if(token==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])

        let order_status = await alpha_payment_service.get_payment_status(orderId);
        let checkout = await db_connection.checkout.findFirstOrThrow({
            where:{
                orderId:Number(orderId)
            }
        })
        if(order_status.data.orderStatus==2){
            // if(checkout==null)
            //     throw new BaseError(417,"order with this id not found",[]);
            checkout = await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    status:"completed"
                },
                include:get_checkout_include(lang)
            })
        }
        else
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer, message:"unsuccessful payment status"}])
        
        // let [totalProducts, products, totalAmount]  = get_checkot_data(checkout as CheckoutWithExtraInfo);
        // let rconn = await create_message_broker_connection()
        // await publish(checkout, products, totalProducts, token, totalAmount)

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: {}
        })
    }
}