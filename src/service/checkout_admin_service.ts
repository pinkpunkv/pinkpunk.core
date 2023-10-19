import { PrismaClient,DeliveryType, Prisma, CheckoutStatus } from '@prisma/client'
import { HttpRequest } from "../common";

import UserAttr from '../common/user_attr'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import Decimal from 'decimal.js';

export default function make_admin_checkout_service(db_connection:PrismaClient){
    return Object.freeze({
        updateCheckout,
        getCheckouts,
        removeVariantFromCheckout,
        decreaseCountFromCheckout,
        addToCheckout,
        getCheckoutInfo,
        getUserCheckouts
    });

    function mapCheckoutToResponse(checkout){
        checkout.total = 0;
        checkout.currencySymbol = "BYN";
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
    async function getCheckout(lang,checkId) {
        return db_connection.checkout.findFirst({
            where:{id:checkId},
            include:{
                info:true,
                variants:getInclude(lang),
                address:{include:{fields:true}}
            }
        })
    }

    async function getCheckoutWithoutFields(checkId) {
        return db_connection.checkout.findFirst({
            where:{id:checkId},
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
    async function getUserCheckouts(req:HttpRequest) {
        let {lang="ru",statuses="completed,pending,declined,preprocess",userId=""}= {...req.query}
        let statuses_ = statuses.split(",") as Prisma.Enumerable<CheckoutStatus>
        if (req.user.isAnonimus||userId=="")
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
            include:{
                info:true,
                user: true,
                variants:getInclude(lang),
                address:{include:{fields:true}}
            }
        })

        return {
            status:StatusCodes.OK,
            message:"success",
            content: checkouts.map(x=>mapCheckoutToResponse(x))
        }
    }
    async function updateCheckout(req:HttpRequest) {
        let checkoutId = req.params["checkoutId"]
        let {lang="ru"}= {...req.query}
        console.log(req.body);
        
        let {deliveryType = "pickup",email="",phone="", status="pending" } = {...req.body}
        let contactfirstName=req.body['firstName']
        let contactlastName=req.body['lastName']
        let {id=undefined,mask="",firstName="", lastName="", company="", apartment="",comment="",building="", street="", zipCode="", city="",country=""} = {...req.body['address']}
        let address;
        let checkout = await getCheckoutWithoutFields(checkoutId)
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        if(id==null)
        address = await db_connection.address.create({
            data:{
                userId:checkout.userId,
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
                }
            },
            include:{
                fields:true
            }
        })
      
        let checkout_ = await db_connection.$transaction(async ()=>{
            return await db_connection.checkout.update({
                where:{
                    id:checkout.id
                },
                data:{
                    "status":status as CheckoutStatus,
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
                },
                include:{
                    info:true,
                    variants:getInclude(lang),
                    address:{include:{fields:true}}
                }
            })
        })
        
        return {
            "status":StatusCodes.OK,
            message:"success",
            content: mapCheckoutToResponse(checkout_)
        }    
    }
    async function addToCheckout(req:HttpRequest) {
        let{checkoutId=""}={...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await getCheckout(lang,checkoutId)

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
    async function getCheckouts(req:HttpRequest) {
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
                status:{
                    in:statuses_
                }
            },
            include:{
                info:true,
                user: true,
                variants:getInclude(lang),
                address:{include:{fields:true}}
            }
        })

        let total = await db_connection.checkout.aggregate({
            _count:true,
            where:{
                status:{
                    in:statuses_
                }
            }
        })

         
        return {
            status:StatusCodes.OK,
            message:"success",
            content:{
                checkouts:checkouts.map(x=>mapCheckoutToResponse(x)),
                total:total
            }
        }
    }

    async function getCheckoutInfo(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {lang="ru"} = {...req.query};
        let checkout = await getCheckout(lang,checkoutId)

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
        let checkout = await getCheckoutWithoutFields(checkoutId)

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
        let checkout = await getCheckout(lang,checkoutId)

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