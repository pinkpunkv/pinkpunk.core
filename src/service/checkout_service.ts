import { PrismaClient,DeliveryType,Prisma, PaymentType } from '@prisma/client'
import { HttpRequest } from "../common";

import UserAttr from '../common/user_attr'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import {CustomerErrorCode} from '../common'
import { createRabbitMQConnection } from '../helper';
import Decimal from 'decimal.js';
import {paymentSrvice} from '../helper'

import generateToken from '../utils/generate_token';
import { Address,AddressField } from '../entities/address';
import { config } from '../config';

export default function make_checkout_service(db_connection:PrismaClient){
    return Object.freeze({
        preprocessCheckout,
        updateCheckout,
        removeVariantFromCheckout,
        decreaseCountFromCheckout,
        addToCheckout,
        getCheckout,
        payCheckout,
        placeOrder,
        updateCheckoutStatus
    });

    function mapCheckoutToResponse(checkout){
        checkout.total = 0;
        checkout.currencySymbol = "BYN";
        delete checkout.infoId
        delete checkout.info?.id
        let totalAmount = new Decimal(0), color;
        checkout.variants.forEach(x=>{
            x.id=x.variantId
            x.product = x.variant.product
            color = x.variant.color
            x.variant.product.fields.forEach(async(field)=>{
                x.product[field.fieldName]=field.fieldValue
            })
            x.variant.product.images?.forEach((image)=>{
                x.product['image'] = image.image;
            })
            checkout.total+=x.count
            totalAmount = totalAmount.add(new Decimal(x.count).mul(new Decimal(x.product.price)))
            x.maxCount = x.variant.count
            x.size = x.variant.size
            x.color = color.color
            x.colorText = color.colorText
            delete x.variantId
            delete x.checkoutId
            delete x.variant
            delete x.product.fields
            delete x.product.images
        })
        checkout.totalAmount = totalAmount;
        return checkout;
    }

    async function getUserAdress(addrId,user:UserAttr) {
        return await db_connection.address.findFirst({
            where:user.isAnonimus?{
                id:addrId,
                userId:null
            }:{
                id:addrId,
                userId:user.id
            },
            include:{
                fields:true   
            }
        })
    }

    async function getCheckoutVariant(checkId,variantId) {
        return await db_connection.checkoutVariants.findFirst({
            where:{checkoutId:checkId,variantId:Number(variantId)},
            include:{
                variant:{
                    select:{
                        count:true
                    }
                }
            }
        })
    }

    async function getUserCart(cartId,user:UserAttr) {
        return db_connection.cart.findFirst({
            where:{id:cartId},
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

    async function getUserCheckout(lang,checkId,user:UserAttr,status) {
        return db_connection.checkout.findFirst({
            where:{id:checkId},
            include:getCheckoutInclude(lang)
        })
    }

    async function getUserCheckoutWithoutFields(checkId,user:UserAttr,status) {
        return db_connection.checkout.findFirst({
            where:{id:checkId,status:status},
            include:{
                variants:true,
                info:true,
                address:true
            }
        })
    }

    function getInclude(lang) {
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
    function getCheckoutInclude(lang:String){
        return {
            variants:{ include:{ variant:getInclude(lang)}},
            info:true,
            address:{include:{fields:true}}
        }
    }
    async function preprocessCheckout(req:HttpRequest) {
        let {lang="ru",checkoutId="",cartId=""}= {...req.query}
        let checkout = await getUserCheckoutWithoutFields(checkoutId, req.user, "preprocess")
        
        let checkout_ = await db_connection.$transaction(async ()=>{
            let cart = await getUserCart(cartId,req.user)
            if(cart==null)
                throw new BaseError(417,"cart not found",[]);
            checkout = await db_connection.checkout.upsert({
                where:{
                    id:checkoutId
                },
                create:{
                    status:'preprocess',
                    userId:req.user.isAnonimus?null:req.user.id,
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
                include:getCheckoutInclude(lang)
            })
            
            return checkout;
        })
        
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCheckoutToResponse(checkout_)
        }
    }

    async function updateCheckout(req:HttpRequest) {
        let checkoutId = req.params["checkoutId"]
        let {lang="ru"}= {...req.query}
        let {deliveryType = "pickup",email="",phone="",paymentType="cash",firstName="",lastName="", comment=""} = {...req.body}
        let addressData = Address.fromObject(req.body['address'])
        let addressField = AddressField.fromObject(req.body['address'])

        if (addressData==null && deliveryType != "pickup")
            throw new BaseError(417,"address data is required",[]);
        let address_field = {
            apartments:   addressField.apartments,
            city:         addressField.city,
            type:         "shipping",
            company:      addressField.company,
            country:      addressField.country,
            firstName:    firstName,
            lastName:     lastName,
            streetNumber: addressField.streetNumber,
            zipCode:      addressField.zipCode
        } as Prisma.AddressFieldsCreateWithoutAddressInput

        let address = null;
        if (deliveryType!="pickup")
            address = await db_connection.address.upsert({
                where:{
                    id:addressData?.id
                },
                create:{
                    userId:req.user.id,
                    mask: addressData.mask,
                    fields:{
                        create:address_field
                    },
                },
                update:{
                    mask:addressData.mask,
                    fields:{
                        deleteMany:{
                            addressId:addressData.id
                        },
                        create:address_field
                    }
                },
                include:{
                    fields:true
                }
            })
        
        // let address = await getUserAdress(addressId,req.user)
        // if (address==null&&deliveryType!="pickup")
        //     throw new BaseError(417,"address not found",[]);
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.user,"preprocess")
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        
        let checkout_ = await db_connection.$transaction(async ()=>{
            return await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    address:address!=null?{connect:{id:address?.id}}:{},
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
                include:getCheckoutInclude(lang)
            })
        })
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCheckoutToResponse(checkout_)
        }    
    }
    async function addToCheckout(req:HttpRequest) {
        let{checkoutId=""}={...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        variantId = Number(variantId)
        let checkout = await getUserCheckout(lang,checkoutId,req.user,"preprocess")
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
            return { status:StatusCodes.OK, message:"success", content: mapCheckoutToResponse(checkout)}
        
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
                variant:getInclude(lang)
            }
        })
        
        if (ind!=-1)
            checkout.variants[ind].count+=1;
        else
            checkout.variants.push(checkoutVariant as any)
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCheckoutToResponse(checkout)
        }
    }
    async function getCheckout(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        let checkout = await getUserCheckout(lang,checkoutId,req.user,"preprocess")
        if(checkout==null)
            throw new BaseError(417,"checkout with this id not found",[]);
         
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCheckoutToResponse(checkout)
        }
    }
    async function removeVariantFromCheckout(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.user,"preprocess")
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
            include:getCheckoutInclude(lang)
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCheckoutToResponse(checkout)
        }
    }

    async function decreaseCountFromCheckout(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await getUserCheckout(lang,checkoutId,req.user,"preprocess")
        if(checkout==null)
            throw new BaseError(417,"checkout with this id not found",[]);
        let checkoutVariant = await getCheckoutVariant(checkoutId,variantId);
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
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: mapCheckoutToResponse(checkout)
        }
    }

    async function payCheckout(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        
        let checkout = await getUserCheckout(lang,checkoutId,req.user,"preprocess")
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        if(checkout.paymentType!="online")
            throw new BaseError(417,"invalid payment type",[]);
        if(checkout.info==null)
            throw new BaseError(417,"user details is required",[]);
        // let status = await paymentSrvice.getOrderStatus(checkout.orderId.toString())
        // if(status.data.actionCode==-100){
        //     let orderId = status.data.attributes.filter(x=>x.name=="mdOrder")[0].value;
            
        //     return {
        //         status:StatusCodes.OK,
        //         message:"success",
        //         content: {"orderId":orderId,"formUrl":"https://abby.rbsuat.com/payment/merchants/www.pinkpunk.by_6261D2C6014F4/payment_ru.html?mdOrder="+orderId}
        //     }
        // }
        let totalAmount = new Decimal(0);
            
        for (const variant of checkout.variants) {  
            let itemAmount = new Decimal(variant['variant']['product'].price).mul(new Decimal(variant.count))
            totalAmount=totalAmount.add(itemAmount)
        }
        
        totalAmount=totalAmount.mul(new Decimal(100))
        let res = await db_connection.$transaction(async ()=>{ 
            let token = await db_connection.token.create({
                data:{
                    token:generateToken(),
                    type:"order",
                    objectId:checkout.orderId.toString()
                }
            })
            
            let new_orderId = await db_connection.$queryRaw`SELECT nextval('"public"."Checkout_orderId_seq"')`;
            checkout.orderId = Number(new_orderId[0].nextval)
            await db_connection.checkout.update({
                where:{id:checkout.id},
                data:{
                    orderId:{
                        set:checkout.orderId 
                    }
                }
            })
            
            let payres = await paymentSrvice.payForOrder(checkout.orderId.toString(),totalAmount,token.token)
            if(payres.data.errorCode)
                throw new BaseError(500,"something went wrong",payres.data);
            await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    status:"pending"
                }
            })
            
            return payres.data;
        })
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: res
        }
    }

    async function payGoogleCheckout(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        
        let checkout = await getUserCheckout(lang,checkoutId,req.user,"preprocess")
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        if(checkout.paymentType!="online")
            throw new BaseError(417,"invalid payment type",[]);
        let status = await paymentSrvice.getOrderStatus(checkout.orderId.toString())
        if(status.data.actionCode==-100){
            let orderId = status.data.attributes.filter(x=>x.name=="mdOrder")[0].value;
            return {
                status:StatusCodes.OK,
                message:"success",
                content: {"orderId":orderId,"formUrl":"https://abby.rbsuat.com/payment/merchants/www.pinkpunk.by_6261D2C6014F4/payment_ru.html?mdOrder="+orderId}
            }
        }
        let totalAmount = new Decimal(0);
            
        for (const variant of checkout.variants) {  
            let itemAmount = new Decimal(variant['variant']['product'].price).mul(new Decimal(variant.count))
            totalAmount=totalAmount.add(itemAmount)
        }
        let token = await db_connection.token.create({
            data:{
                token:generateToken(),
                type:"order",
                objectId:checkout.orderId.toString()
            }
        })
        totalAmount=totalAmount.mul(new Decimal(100))
        let res = await db_connection.$transaction(async ()=>{ 
            if(status.data.actionCode==-2007||status.data.errorCode==1)
            {   
                let new_orderId = await db_connection.$queryRaw`SELECT nextval('"public"."Checkout_orderId_seq"')`;
                checkout.orderId = Number(new_orderId[0].nextval)
                await db_connection.checkout.update({
                    where:{id:checkout.id},
                    data:{
                        orderId:{
                            set:checkout.orderId 
                        }
                    }
                })
            }
            let payres = await paymentSrvice.payForOrder(checkout.orderId.toString(),totalAmount,token.token)
            if(payres.data.errorCode)
                throw new BaseError(500,"something went wrong",payres.data);
            await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    status:"pending"
                }
            })
            
            return payres.data;
        })
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: res
        }
    }

    async function placeOrder(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        
        let checkout = await getUserCheckout(lang,checkoutId,req.user,"preprocessed")
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
        let totalProducts = 0;
        let products= [];
        let totalAmount = new Decimal(0);
            
        for (const variant of checkout.variants) {
            totalProducts+=variant.count;
            let product = variant['variant']['product'] 
            let itemAmount = new Decimal(variant.variant['product'].price).mul(new Decimal(variant.count))
            products.push({
                name:product.fields.filter(x=>x.fieldName=="name")[0],
                color:variant.variant['color'].colorText,
                size:variant['variant'].size,
                basePrice:product.basePrice,
                price:product.price,
                count:variant.count
            })
            totalAmount=totalAmount.add(itemAmount)
        }
        let token = await db_connection.token.create({
            data:{ 
                token:generateToken(),
                type:"order",
                objectId:checkout.orderId.toString()
            }
        })
        totalAmount=totalAmount.mul(new Decimal(100))
        let res = await db_connection.$transaction(async ()=>{ 
            await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    status:"pending"
                }
            })
            let rconn = await createRabbitMQConnection()
            await rconn.sendMessage("user",JSON.stringify({email:checkout.info.email,type:"order",ct:token.token,checkoutInfo:{
                orderId:checkout.orderId,
                productsCount:totalProducts,
                total:totalAmount,
                deliveryPrice:0,
                products:products,
                info:{
                    contactFL:checkout.info.firstName+" "+checkout.info.lastName,
                    email:checkout.info.email,
                    phone:checkout.info.phone,
                    addressFL:checkout.address.fields[0].firstName+" "+checkout.address.fields[0].lastName,
                    address:checkout.address.fields[0].streetNumber,
                    postalCode:checkout.address.fields[0].zipCode,
                    city:checkout.address.fields[0].city
                },
                discount:0,
                finalTotal:totalAmount,
                lang:"BY"
            }}))
            return {orderId:checkout.orderId};
        })

        return {
            status:StatusCodes.CREATED,
            message:"success",
            content: res
        }
    }

    async function updateCheckoutStatus(req:HttpRequest) {

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
                include:getCheckoutInclude(lang)
            })
        }
        else{
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"unsuccessful payment status"}])
        }
        let totalProducts = 0;
        let products= [];
        let totalAmount = new Decimal(0);
            
        for (const variant of checkout.variants) {
            totalProducts+=variant.count;
            let product = variant['variant'].product 
            let itemAmount = new Decimal(variant['variant'].product.price).mul(new Decimal(variant.count))
            products.push({
                name:product.fields.filter(x=>x.fieldName=="name")[0],
                color:variant.variant['color'].colorText,
                size:variant['variant'].size,
                basePrice:product.basePrice,
                price:product.price,
                count:variant.count
            })
            totalAmount=totalAmount.add(itemAmount)
        }
        let rconn = await createRabbitMQConnection()
        await rconn.sendMessage("user",JSON.stringify({email:checkout.info.email,type:"order",ct:token.token,checkoutInfo:{
            orderId:checkout.orderId,
            productsCount:totalProducts,
            total:totalAmount,
            deliveryPrice:0,
            products:products,
            info:{
                contactFL:checkout.info.firstName+" "+checkout.info.lastName,
                email:checkout.info.email,
                phone:checkout.info.phone,
                addressFL:checkout.address.fields[0].firstName+" "+checkout.address.fields[0].lastName,
                address:checkout.address.fields[0].streetNumber,
                postalCode:checkout.address.fields[0].zipCode,
                city:checkout.address.fields[0].city
            },
            discount:0,
            finalTotal:totalAmount,
            lang:"BY"
        }}))

        return {
            status:StatusCodes.OK,
            message:"success",
            content: {}
        }
    }
}