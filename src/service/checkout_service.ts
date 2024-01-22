import { PrismaClient,DeliveryType,Prisma, PaymentType , Address, CheckoutStatus, Checkout, Token, Field, PromoCode, CheckoutVariants, AddressFields, CheckoutInfo, Variant} from '@prisma/client'
import { Request, Response } from "express";

import {RequestUser} from '../common/request_user'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import {CustomerErrorCode, HttpValidationException} from '../common'
import { create_message_broker_connection } from '../helper';
import Decimal from 'decimal.js';
import {alpha_payment_service} from '../helper'

import generateToken from '../utils/generate_token';
import {AddressFieldDto, AddressDto} from '../dto'
import { ProductMessage, ValidationErrorWithConstraints } from '../abstract/types';
import { order_delivery_type_validator } from '../helper/validator';


async function publish(checkout: Checkout & any, products:ProductMessage[], total: number, token: Token, total_amount: Decimal) {
    let rconn = await create_message_broker_connection()
    await rconn.publish_order_info("order",checkout!.info!.email, token.token,"BY", {
        orderId:checkout!.orderId,
        productsCount:total,
        total:total_amount.toString(),
        deliveryPrice:"0",
        products:products,
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
        discount:"0",
        finalTotal:total_amount.toString(),
    })
}

type CheckoutWithInfo = Checkout&{
    variants: CheckoutVariants[];
    info: CheckoutInfo | null,
    address: Address | null;
}

type CheckoutWithExtraInfo = Checkout&{
    variants: CheckoutVariants[];
    info: CheckoutInfo | null,
    address: Address & {fields: AddressFields[]} | null;
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

    function map_checkout(checkout: Checkout & any){
        checkout.total = 0;
        checkout.currencySymbol = "BYN";
        delete checkout.infoId
        delete checkout.info?.id
        let totalAmount = new Decimal(0), color;
        checkout.variants.forEach((x:any)=>{
            x.id=x.variantId
            x.product = x.variant.product
            color = x.variant.color
            x.variant.product.fields.forEach(async(field:Field)=>{
                x.product[field.fieldName]=field.fieldValue
            })
            x.variant.product.images?.forEach((image:any)=>{
                x.product['image'] = image.image;
            })
            checkout.total+=x.count
            totalAmount = totalAmount.add(new Decimal(x.count).mul(new Decimal(x.product.price)))
            x.maxCount = x.variant.count
            x.size = x.variant.size
            x.color = x.variant.color
            // x.colorText = color.colorText
            delete x.variantId
            delete x.checkoutId
            delete x.variant
            delete x.product.fields
            delete x.product.images
        })
        checkout.totalAmount = totalAmount;
        return checkout;
    }

    async function get_user_address(address_id: string,user:RequestUser) {
        return await db_connection.address.findFirst({
            where:user.is_anonimus?{
                id:address_id,
                userId:null
            }:{
                id:address_id,
                userId:user.id
            },
            include:{
                fields:true   
            }
        })
    }

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
        return await db_connection.checkout.findFirstOrThrow({
            where:{id:checkout_id},
            include:get_checkout_include(lang),
        })
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
            variants:{ include:{ variant: get_include(lang)}},
            info:true,
            address:{include:{fields:true}},
        }
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
            content: checkouts.map(x=>map_checkout(x))
        })
    }

    async function preprocess_checkout(req:Request, res: Response) {
        let {lang="ru",checkoutId="",cartId=""}= {...req.query}
        let checkout = await get_checkout_by_status(checkoutId, "preprocess")
        
        let checkout_ = await db_connection.$transaction(async ()=>{
            let cart = await get_user_cart(cartId)
            checkout = await db_connection.checkout.upsert({
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
                        deleteMany:checkout?{
                            checkoutId:checkout.id
                        }:{},
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                },
                include:get_checkout_include(lang)
            })
            
            return checkout;
        })
        
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout_)
        })
    }

    async function use_promo(req:Request, res: Response) {
        if (!req.query["promoCode"]) throw new HttpValidationException([new ValidationErrorWithConstraints({"promoCode":"field i srequired"})])
        let code = req.query["promoCode"]!.toString()
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
                promos:{
                    connect: promo_code
                }
            }
        })

        return res.status(StatusCodes.CREATED).send({
            status:StatusCodes.CREATED,
            message:"success",
            content: {

            }
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
            content: map_checkout(checkout_)
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
                content: map_checkout(checkout)
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
            content: map_checkout(checkout)
        })
    }

    async function get_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        let checkout = await get_checkout_or_throw(lang, checkoutId)
        
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

        let variant = await db_connection.variant.findFirstOrThrow({
            where:{id: Number(variantId), deleted: false}
        })

        checkout = await db_connection.checkout.update({
            where:{id:checkout.id},
            data:{
                variants:{
                    delete:{
                        checkoutId_variantId:{
                            variantId:variant.id,
                            checkoutId:checkout.id
                        }
                    }
                }
            },
            include:get_checkout_include(lang)
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
        
        let checkout_variant = await get_checkout_variant(checkoutId, variantId);
        if(checkout_variant == null)
            throw new BaseError(417,"checkout variant with this id not found",[]);

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
            content: map_checkout(checkout)
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
            let [totalProducts, products, totalAmount] = get_checkot_data(checkout.variants);
            let token = await db_connection.token.create({
                data:{ 
                    token:generateToken(),
                    type:"order",
                    objectId:checkout!.orderId.toString()
                }
            })
            if (checkout.paymentType == PaymentType.online){
                let order_status = await alpha_payment_service.get_payment_status(order_id.toString());
        
                if(order_status.data.orderStatus==2)
                    return order_info

                order_id = Number(
                    (await db_connection.$queryRaw<{nextval:Number}[]>`SELECT nextval('"public"."Checkout_orderId_seq"')`)[0].nextval
                );
                
                let payres = await alpha_payment_service.create_payment(order_id.toString(), totalAmount, token.token)
                if(payres.data.errorCode)
                    throw new BaseError(500,"something went wrong",payres.data);
                order_info.formUrl = payres.data.formUrl!
            }

            await db_connection.checkout.update({
                where:{
                    id:checkout!.id
                },
                data:{
                    orderId: order_id,
                    status:"pending"
                }
            })
            order_info.orderId = order_id
            await publish(checkout, products, totalProducts, token, totalAmount)
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
            return {
                status:StatusCodes.OK,
                message:"success",
                content: {
                    orderId:checkout.orderId
                }
            }
        let [product_total, products, total_amount] = get_checkot_data(checkout.variants);
            
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
            await publish(checkout, products, product_total, token, total_amount.mul(new Decimal(100)))
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
        let checkout;
        if(order_status.data.orderStatus==2){
            checkout = await db_connection.checkout.findFirstOrThrow({
                where:{
                    orderId:Number(orderId)
                }
            })
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
        
        let [totalProducts, products, totalAmount]  = get_checkot_data(checkout.variants, checkout.pr);
            
        // let rconn = await create_message_broker_connection()
        // await publish(checkout, products, totalProducts, token, totalAmount)

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: {}
        })
    }

    function get_checkot_data(variants:any[], promos:PromoCode[]):[number, any[], Decimal]{
        let total_products = 0;
        let products:ProductMessage[]=[];
        let total_amount = new Decimal(0);
            
        for (const variant of variants) {
            total_products+=variant.count;
            let product = variant['variant'].product 
            let item_amount = new Decimal(variant['variant'].product.price).mul(new Decimal(variant.count))
            products.push({
                name:product.fields.filter((x:any)=>x.fieldName=="name")[0],
                color:variant.variant['color'].colorText,
                size:variant['variant'].size,
                basePrice:product.basePrice,
                price:product.price,
                count:variant.count,
                image:product.images[0].url
            })
            total_amount=total_amount.add(item_amount)
        }
        for (const promo of promos){
            total_amount = total_amount.mul(new Decimal(1).minus(new Decimal(promo.amount)))
        }
        return [total_products, products, total_amount]
    }
}