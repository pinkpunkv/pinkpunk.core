import { PrismaClient,DeliveryType,Prisma } from '@prisma/client'
import { HttpRequest } from "../common";

import UserAttr from '../common/user_attr'
import {StatusCodes} from 'http-status-codes'
import { BaseError } from '../exception';

import Decimal from 'decimal.js';

export default function make_checkout_service(db_connection:PrismaClient){
    return Object.freeze({
        preprocessCheckout
    });
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

    async function getUserCheckout(lang,checkId,user:UserAttr) {
        return db_connection.checkout.findFirst({
            where:user.isAnonimus?
            {id:checkId,userId:null}
            :
            {userId:user.id},
            
            include:{
                variants:getInclude(lang)
            }
        })
    }
    async function getUserCheckoutWithoutFields(checkId,user:UserAttr) {
        return db_connection.checkout.findFirst({
            where:user.isAnonimus?
            {id:checkId,userId:null}
            :
            {userId:user.id},
            
            include:{
                variants:true
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
                                    where:{
                                        language:{ 
                                            symbol:{equals: lang,mode: 'insensitive'}
                                        }
                                    }
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
        let res = await db_connection.$transaction(async ()=>{
            let {lang="ru"}= {...req.query}
            let {email="",phone="", deliveryType = "pickup", addressId = null,cartId=""} = {...req.body} 
            let cart = await getUserCart(cartId,req.user)
            if(cart==null)
                throw new BaseError(417,"cart not found",[]);
            let address = await getUserAdress(addressId,req.user)
            if (address==null)
                throw new BaseError(417,"address not found",[]);
            
            let checkout = await db_connection.checkout.create({
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
                    addressId:address.id,
                },
                include:{
                    variants:getInclude(lang)
                }
            })
            return checkout;
        })
        
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: res
        }
    }

    async function updateCheckout(req:HttpRequest) {
        let checkoutId = req.params["checkoutId"]
        let {lang="ru"}= {...req.query}
        let {addressId="",deliveryType = "pickup",email="",phone="" } = {...req.body} 
        let address = await getUserAdress(addressId,req.user)
        if (address==null)
            throw new BaseError(417,"address not found",[]);
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.user)
        if(checkout==null)
            throw new BaseError(417,"checkout not found",[]);
        checkout = await db_connection.$transaction(async ()=>{
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
                    addressId:address.id,
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
                    variants:getInclude(lang)
                }
            })
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: checkout
        }    
    }

    async function removeVariantFromCheckout(req:HttpRequest) {
        let {checkoutId=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let checkout = await getUserCheckoutWithoutFields(checkoutId,req.user)

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
            include:{variants:getInclude(lang) }
        })
         
        return {
            status:StatusCodes.OK,
            message:"success",
            content: checkout
        }
    }

    // async function decreaseCountFromCart(req:HttpRequest) {
    //     let {cartId=""} = {...req.params}
    //     let {variantId=0,lang="ru"} = {...req.query};
    //     let variantsData = await getUserCheckout(lang,cartId,req.user)
    //     let cartVariant = await getCartVariant(variantsData.id,variantId)
       
    //     if(cartVariant!=null&&cartVariant.count==1){
    //         variantsData = await db_connection.cart.update({
    //             where:{id:variantsData.id},
    //             data:{
    //                 variants:{
    //                     delete:{
    //                         variantId_cartId:{
    //                             variantId:Number(variantId),
    //                             cartId:cartId
    //                         }
    //                     }
    //                 }
    //             },
    //             include:{variants:getInclude(lang) }
    //         })
    //     }
    //     else{
    //         await db_connection.cartVariants.update({
    //             where:{
    //                 variantId_cartId:{
    //                     cartId:variantsData.id,
    //                     variantId:Number(variantId),   
    //                 }
    //             },
    //             data:{
    //                 count:{decrement:1}
    //             }
    //         })
    //         let ind = variantsData.variants.findIndex(x=>x.variantId==variantId)
    //         variantsData.variants[ind].count-=1; 
    //     }
         
    //     return {
    //         status:StatusCodes.OK,
    //         message:"success",
    //         content: mapCartToResponse(variantsData)
    //     }
    // }

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