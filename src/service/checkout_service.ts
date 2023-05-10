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
        let totalAmount = new Decimal(0);
        checkout.variants.forEach(x=>{
            console.log(x.variant.product);
            
            x.id=x.variantId
            x.product = x.variant.product
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
            x.color = x.variant.color
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
            include:{
                info:true,
                variants:getInclude(lang),
                address:{include:{fields:true}}
            }
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
                variant:{
                    include:{
                        product:{
                            include:{
                                fields:{
                                    where:{language:{ symbol:{equals: lang,mode: 'insensitive'}}}
                                },
                                tags:true,
                                images:{
                                    where:{
                                        isMain:true
                                    },
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
                        }
                    }
                }
            }    
        } as Prisma.CheckoutVariantsFindManyArgs
    }

    async function preprocessCheckout(req:HttpRequest) {
        let {lang="ru",checkoutId="",cartId=""}= {...req.query}
        
        let checkout = await getUserCheckoutWithoutFields(checkoutId, req.user, "preprocess")
        let isUpdate=false;
        if(checkout!=null){
            isUpdate=true;
        }
        console.log(checkout);
        
        let checkout_ = await db_connection.$transaction(async ()=>{
           
            let cart = await getUserCart(cartId,req.user)
            if(cart==null)
                throw new BaseError(417,"cart not found",[]);
            // let address = await getUserAdress(addressId,req.user)
            // if (address==null&&deliveryType!="pickup")
            //     throw new BaseError(417,"address not found",[]);
            if(isUpdate)
            checkout = await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    // deliveryType:deliveryType as DeliveryType,
                    // info:{
                    //     update:{
                    //         email:email,
                    //         phone:phone
                    //     }
                    // },
                    userId:req.user.isAnonimus?checkout.userId:req.user.id,
                    variants:{
                        deleteMany:{
                            checkoutId:checkout.id
                        },
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                    // address:address?{
                    //     connect:{
                    //         id:address.id
                    //     }
                    // }:{}
                },
                include:{
                    variants:getInclude(lang),
                    info:true,
                    address:{include:{fields:true}}
                }
            })
            else
            checkout = await db_connection.checkout.create({
                data:{
                    status:'preprocess',
                   // deliveryType:deliveryType as DeliveryType,
                    // info:{
                    //     create:{
                    //         email:email,
                    //         phone:phone
                    //     }
                    // },
                    userId:req.user.isAnonimus?null:req.user.id,
                    variants:{
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                    // address:address?{
                    //     connect:{
                    //         id:address.id
                    //     }
                    // }:{}
                },
                include:{
                    variants:getInclude(lang),
                    info:true,
                    address:{include:{fields:true}}
                }
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
        let {deliveryType = "pickup",email="",phone="",paymentType="cash"} = {...req.body}
        let contactfirstName=req.body['firstName']
        let contactlastName=req.body['lastName']
        let {id=undefined,mask="",firstName="", lastName="", company="",streetNumber="",apartments="", zipCode="", city="",country=""} = {...req.body['address']}
        let address;
        if(id==null)
        address = await db_connection.address.create({
            data:{
                userId:req.user.id,
                mask: mask,
                fields:{
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
                },
            },
            include:{
                fields:true
            }
        })
        else
        address = await db_connection.address.update({
            where:{
                id:id
            },
            data:{
                mask:mask,
                fields:{
                    deleteMany:{
                        addressId:id
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
                        delete:true,
                        create:{
                            email:email,
                            phone:phone,
                            firstName:contactfirstName,
                            lastName:contactlastName
                        }
                        
                    },
                    paymentType:paymentType as PaymentType
                },
                include:{
                    info:true,
                    variants:getInclude(lang),
                    address:{include:{fields:true}}
                }
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
        let checkout = await getUserCheckout(lang,checkoutId,req.user,"preprocess")

        if(checkout==null)
            throw new BaseError(417,"checkout with this id not found",[]);
            
        let checkoutVariant = await getCheckoutVariant(checkout.id,variantId)
       
        if (checkoutVariant==null){
            checkout = await db_connection.checkout.update({
                where:{id:checkout.id},
                data:{
                    variants:{
                        create: {variantId:Number(variantId)}
                    }
                },
                include:{info:true,variants:getInclude(lang),address:{include:{fields:true}}}
            });
        }
        else{
            if(checkoutVariant.variant.count>=checkoutVariant.count+1){
                await db_connection.checkoutVariants.update({
                    where:{
                        checkoutId_variantId:{
                            checkoutId:checkout.id,
                            variantId:Number(variantId),   
                        }
                    },
                    data:{
                        count:{increment:1}
                    }
                })
                let ind = checkout.variants.findIndex(x=>x.variantId==variantId)
                checkout.variants[ind].count+=1;
            }
            
        }
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
            include:{variants:getInclude(lang),address:true,info:true }
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
        if(checkoutVariant!=null&&checkoutVariant.count==1){
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
                include:{variants:getInclude(lang), address:{include:{fields:true}},info:true }
            })
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
            let ind = checkout.variants.findIndex(x=>x.variantId==variantId)
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
            let itemAmount = new Decimal(variant['variant'].product.price).mul(new Decimal(variant.count))
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
                console.log(new_orderId);
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
            let itemAmount = new Decimal(variant['variant'].product.price).mul(new Decimal(variant.count))
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
                console.log(new_orderId);
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
            let product = variant['variant'].product 
            let itemAmount = new Decimal(variant['variant'].product.price).mul(new Decimal(variant.count))
            products.push({
                name:product.fields.filter(x=>x.fieldName=="name")[0],
                color:variant['variant'].colorText,
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
        console.log(orderStatus.data);
        
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
                include:{info:true,variants:getInclude(lang),address:{include:{fields:true}}}
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
                color:variant['variant'].colorText,
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