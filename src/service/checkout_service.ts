import { PrismaClient,DeliveryType,Prisma, PaymentType , Address, CheckoutStatus, Checkout, Token, Field} from '@prisma/client'
import { Request, Response } from "express";

import UserAttr from '../common/user_attr'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import {CustomerErrorCode} from '../common'
import { create_message_broker_connection } from '../helper';
import Decimal from 'decimal.js';
import {paymentSrvice} from '../helper'

import generateToken from '../utils/generate_token';
import {AddressFieldDto, AddressDto} from '../dto'
import { ProductMessage } from '../abstract/types';


async function publish(checkout: Checkout & any, products:ProductMessage[], totalProducts: number, token: Token, totalAmount: Decimal) {
    let rconn = await create_message_broker_connection()
    await rconn.publish_order_info("order",checkout!.info!.email, token.token,"BY", {
        orderId:checkout!.orderId,
        productsCount:totalProducts,
        total:totalAmount.toString(),
        deliveryPrice:"0",
        products:products,
        info:{
            contactFL:checkout!.info!.firstName+" "+checkout!.info!.lastName,
            email:checkout!.info!.email,
            phone:checkout!.info!.phone,
            addressFL:checkout!.address!.fields[0].firstName+" "+checkout!.address!.fields[0].lastName,
            address:`${checkout!.address!.fields[0].street} ${checkout!.address!.fields[0].apartment} ${checkout!.address!.fields[0].building}`,
            postalCode:checkout!.address!.fields[0].zipCode,
            city:checkout!.address!.fields[0].city,
            country: checkout!.address!.fields[0].country
        },
        discount:"0",
        finalTotal:totalAmount.toString(),
    })
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

    async function getUserAdress(address_id: string,user:UserAttr) {
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

    async function get_checkoutVariant(checkout_id:string,variant_id:number) {
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

    async function getUserCart(cart_id:string, user:UserAttr) {
        return db_connection.cart.findFirst({
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

    async function getUserCheckout(lang: string,checkout_id:string,user:UserAttr) {
        return db_connection.checkout.findFirst({
            where:{id:checkout_id},
            include:get_checkout_include(lang)
        })
    }

    async function getUserCheckoutWithoutFields(checkout_id:string,user:UserAttr, status: CheckoutStatus) {
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
            variants:{ include:{ variant:get_include(lang)}},
            info:true,
            address:{include:{fields:true}}
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
        let checkout = await getUserCheckoutWithoutFields(checkoutId, req.body.authenticated_user, "preprocess")
        
        let checkout_ = await db_connection.$transaction(async ()=>{
            let cart = await getUserCart(cartId,req.body.authenticated_user)
            if(cart==null)
                throw new BaseError(417,"cart not found",[]);
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

    async function update_checkout(req:Request, res: Response) {
        let checkoutId = req.params["checkoutId"]
        let {lang="ru"}= {...req.query}
        let {deliveryType = "pickup",email="",phone="",paymentType="cash",firstName="",lastName="", comment=""} = {...req.body}
        let addressData = new AddressDto(req.body['address'])
        let addressField = new AddressFieldDto(req.body['address'])

        if (addressData==null && deliveryType != "pickup")
            throw new BaseError(417,"address data is required",[]);


        let address: Address | undefined;
        if (deliveryType!="pickup")
            address = await db_connection.address.upsert({
                where:{
                    id:addressData.id
                },
                create:{
                    userId:req.body.authenticated_user.id,
                    mask: addressData.mask,
                    fields:{
                        create:addressField
                    },
                },
                update:{
                    mask:addressData.mask,
                    fields:addressData.id?{
                        deleteMany:{
                            addressId:addressData.id
                        },
                        create:addressField
                    }:{
                        create:addressField
                    }
                },
                include:{
                    fields:true
                }
            })
        
        // let address = await getUserAdress(addressId,req.body.authenticated_user)
        // if (address==null&&deliveryType!="pickup")
        //     throw new BaseError(417,"address not found",[]);
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.body.authenticated_user,"preprocess")
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        
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
        let{checkoutId=""}={...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        variantId = Number(variantId)
        let checkout = await getUserCheckout(lang,checkoutId,req.body.authenticated_user)
        let variant = await db_connection.variant.findFirst({
            where:{
                id: variantId,
                deleted:false
            }
        })
        if (variant == null)
            throw new BaseError(417,"variant with this id not found",[]);
        if(checkout==null)
            throw new BaseError(417,"checkout with this id not found",[]);
        let ind = checkout.variants.findIndex(x=>x.variantId==variantId)
        if (ind!=-1&&variant.count==checkout.variants[ind].count)
            return { status:StatusCodes.OK, message:"success", content: map_checkout(checkout)}
        
        let checkoutVariant = await db_connection.checkoutVariants.upsert({
            where:{
                checkoutId_variantId:{
                    checkoutId:checkout.id,
                    variantId:variantId,   
                }
            },
            create:{
                checkoutId:checkout.id,
                variantId:variantId
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
        let checkout = await getUserCheckout(lang,checkoutId,req.body.authenticated_user)
        if(checkout==null)
            throw new BaseError(417,"checkout with this id not found",[]);
         
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_checkout(checkout)
        })
    }
    async function remove_variant_from_checkout(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.body.authenticated_user, CheckoutStatus.preprocess)
        if(checkout==null)
            throw new BaseError(417,"checkout with this id not found",[]);
        checkout = await db_connection.checkout.update({
            where:{id:checkout.id},
            data:{
                variants:{
                    delete:{
                        checkoutId_variantId:{
                            variantId:Number(variantId),
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
        let checkout = await getUserCheckout(lang,checkoutId,req.body.authenticated_user)
        if(checkout==null)
            throw new BaseError(417,"checkout with this id not found",[]);
        let checkoutVariant = await get_checkoutVariant(checkoutId,variantId);
        if(checkoutVariant == null)
            throw new BaseError(417,"checkout variant with this id not found",[]);
        let ind = checkout.variants.findIndex(x=>x.variantId==variantId)
        if(checkoutVariant.count==1){
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
        
        let checkout = await getUserCheckout(lang,checkoutId,req.body.authenticated_user)
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        
        if(checkout.info==null)
            throw new BaseError(417,"user details is required",[]);

        let [totalProducts, products, totalAmount] = _calcCheckoutData(checkout.variants);
        
        let result;
        if (checkout.paymentType=="online"){
            totalAmount=totalAmount.mul(new Decimal(100))
            result = await db_connection.$transaction(async ()=>{ 
                let token = await db_connection.token.create({
                    data:{
                        token:generateToken(),
                        type:"order",
                        objectId:checkout!.orderId.toString()
                    }
                })
                
                let new_orderId: any = await db_connection.$queryRaw`SELECT nextval('"public"."Checkout_orderId_seq"')`;
                checkout!.orderId = Number(new_orderId[0].nextval)
                
                let payres = await paymentSrvice.payForOrder(checkout!.orderId.toString(),totalAmount,token.token)
                if(payres.data.errorCode)
                    throw new BaseError(500,"something went wrong",payres.data);
            
                await db_connection.checkout.update({
                    where:{
                        id:checkout!.id
                    },
                    data:{
                        status:"pending",
                        orderId:{
                            set:checkout!.orderId 
                        }
                    }
                })
                
                return payres.data;
            })
        }
        else
            result = await db_connection.$transaction(async ()=>{
                let token = await db_connection.token.create({
                    data:{ 
                        token:generateToken(),
                        type:"order",
                        objectId:checkout!.orderId.toString()
                    }
                })
                await db_connection.checkout.update({
                    where:{
                        id:checkout!.id
                    },
                    data:{
                        status:"pending"
                    }
                })
                await publish(checkout, products, totalProducts, token, totalAmount)
                return {orderId:checkout!.orderId};
            })
        
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: res
        })
    }

    async function place_order(req:Request, res: Response) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        
        let checkout = await getUserCheckout(lang,checkoutId,req.body.authenticated_user)
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        if(checkout.paymentType=="online")
            throw new BaseError(417,"invalid payment type",[]);
        if(checkout.status=="pending")
            return {
                status:StatusCodes.CREATED,
                message:"success",
                content: {
                    orderId:checkout.orderId
                }
            }
        let [totalProducts, products, totalAmount] = _calcCheckoutData(checkout.variants);
            
        let token = await db_connection.token.create({
            data:{ 
                token:generateToken(),
                type:"order",
                objectId:checkout.orderId.toString()
            }
        })
        totalAmount=totalAmount.mul(new Decimal(100))
        let ressult = await db_connection.$transaction(async ()=>{ 
            await db_connection.checkout.update({
                where:{
                    id:checkout!.id
                },
                data:{
                    status:"pending"
                }
            })
            let rconn = await create_message_broker_connection()
            await publish(checkout, products, totalProducts, token, totalAmount)
            return {orderId:checkout!.orderId};
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: ressult
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

        let orderStatus = await paymentSrvice.getOrderStatus(orderId);
        let checkout;
        if(orderStatus.data.orderStatus==2){
            checkout = await db_connection.checkout.findFirst({
                where:{
                    orderId:Number(orderId)
                }
            })
            if(checkout==null)
                throw new BaseError(417,"order with this id not found",[]);
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
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"unsuccessful payment status"}])
        
        let [totalProducts, products, totalAmount]  = _calcCheckoutData(checkout.variants);
            
        let rconn = await create_message_broker_connection()
        await publish(checkout, products, totalProducts, token, totalAmount)

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: {}
        })
    }

    function _calcCheckoutData(variants:any[]):[number, any[], Decimal]{
        let totalProducts = 0;
        let products:ProductMessage[]=[];
        let totalAmount = new Decimal(0);
            
        for (const variant of variants) {
            totalProducts+=variant.count;
            let product = variant['variant'].product 
            let itemAmount = new Decimal(variant['variant'].product.price).mul(new Decimal(variant.count))
            products.push({
                name:product.fields.filter((x:any)=>x.fieldName=="name")[0],
                color:variant.variant['color'].colorText,
                size:variant['variant'].size,
                basePrice:product.basePrice,
                price:product.price,
                count:variant.count,
                image:product.images[0].url
            })
            totalAmount=totalAmount.add(itemAmount)
        }
        return [totalProducts, products, totalAmount]
    }
}