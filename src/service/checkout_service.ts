import { PrismaClient,DeliveryType,Prisma } from '@prisma/client'
import { HttpRequest } from "../common";

import UserAttr from '../common/user_attr'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import Decimal from 'decimal.js';

export default function make_checkout_service(db_connection:PrismaClient){
    return Object.freeze({
        preprocessCheckout,
        updateCheckout,
        removeVariantFromCheckout,
        decreaseCountFromCheckout,
        addToCheckout,
        getCheckout
    });

    function mapCheckoutToResponse(checkout){
        checkout.total = 0;
        delete checkout.infoId
        delete checkout.info?.id
        let totalAmount = new Decimal(0);
        checkout.variants.forEach(x=>{
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
            where:!user||user.isAnonimus?
            {id:cartId,user:null}
            :
            {user:{id:user.id}},
            
            include:{
                variants:{
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
            where:user.isAnonimus?
            {id:checkId,userId:null}
            :
            {userId:user.id,status:status},
            
            include:{
                info:true,
                variants:getInclude(lang),
                address:{include:{fields:true}}
            }
        })
    }

    async function getUserCheckoutWithoutFields(checkId,user:UserAttr,status) {
        return db_connection.checkout.findFirst({
            where:user.isAnonimus?
            {id:checkId,userId:null,status:status}
            :
            {userId:user.id,status:status},
            
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
        let {lang="ru",checkoutId=""}= {...req.query}
        let {email="",phone="", deliveryType = "pickup", addressId = "",cartId=""} = {...req.body} 
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.user,"preprocess")
        let isUpdate=false;
        if(checkout!=null){
            isUpdate=true;
        }
        let checkout_ = await db_connection.$transaction(async ()=>{
           
            let cart = await getUserCart(cartId,req.user)
            if(cart==null)
                throw new BaseError(417,"cart not found",[]);
            let address = await getUserAdress(addressId,req.user)
            if (address==null&&deliveryType!="pickup")
                throw new BaseError(417,"address not found",[]);
            if(isUpdate)
            checkout = await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    deliveryType:deliveryType as DeliveryType,
                    info:{
                        update:{
                            email:email,
                            phone:phone
                        }
                    },
                    variants:{
                        deleteMany:{
                            checkoutId:checkout.id
                        },
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                    address:address?{
                        connect:{
                            id:address.id
                        }
                    }:{}
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
                    deliveryType:deliveryType as DeliveryType,
                    info:{
                        create:{
                            email:email,
                            phone:phone
                        }
                    },
                    variants:{
                        createMany:{
                            data:cart.variants.map(x=>{return {variantId:x.variantId,count:x.count}})
                        }
                    },
                    address:address?{
                        connect:{
                            id:address.id
                        }
                    }:{}
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
        let {addressId="",deliveryType = "pickup",email="",phone="" } = {...req.body} 
        let address = await getUserAdress(addressId,req.user)
        if (address==null&&deliveryType!="pickup")
            throw new BaseError(417,"address not found",[]);
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.user,"preprocess")
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        let checkout_ = await db_connection.$transaction(async ()=>{
            
            await db_connection.checkoutInfo.delete({
                where:{
                    id:checkout.infoId
                }
            })
            return await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    address:address!=null?{connect:{id:address?.id}}:{},
                    deliveryType:deliveryType as DeliveryType,
                    info:{
                        create:{
                            email:email,
                            phone:phone
                        }
    
                    }
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

    // async function payCheckout(req:HttpRequest) {
    //     let res = await db_connection.$transaction(async ()=>{
    //         let {checkoutId=""} = {...req.params} 
           
    //         let checkout = await getUserCheckout(checkoutId,req.user)
    //         if(checkout==null)
    //             throw new BaseError(417,"checkout not found",[]);
    //         let totalAmount = new Decimal(0);
    //         for (const variant of checkout.variants) {
    //             totalAmount.add(new Decimal(variant.count))
    //         }
    //         let transaction = await db_connection.transaction.create({
    //             data:{
    //                 amount: .
    //             }
    //         })
    //         return checkout;
    //     })
        
        
    //     return {
    //         status:StatusCodes.OK,
    //         message:"success",
    //         content: res
    //     }
    // }
}