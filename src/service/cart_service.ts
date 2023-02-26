import { PrismaClient, User } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import UserAttr from '../common/user_attr'

export default function make_cart_service(db_connection:PrismaClient){
    async function getUserCart(lang,cartId,user:UserAttr) {
        return db_connection.cart.findFirst({
            where:!user||user.isAnonimus?{
                id:Number(cartId),
                user:null
            }:{
                user:{
                    id:user.id
                }
            },
            include:{
                variants:{
                    include:{
                        product:{
                            include:{
                                fields:{
                                    where:{
                                        language:{
                                            symbol:{
                                                equals: lang,
                                                mode: 'insensitive'
                                            }
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
                        },
                        
                    }
                }
            }
        })
    }
    async function createCart(lang,user:UserAttr) {
        return await db_connection.cart.create({
            data:user.isAnonimus?{}:{
                user:{
                    connect:{
                        id:user.id
                    }
                }
            },
            include:{
                variants:{
                    include:{
                        product:{
                            include:{
                                fields:{
                                    where:{
                                        language:{
                                            symbol:{
                                                equals: lang,
                                                mode: 'insensitive'
                                            }
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
                        },
                        
                    }
                }
            }
        })
    }
    async function getUserCartWithoutVariants(cartId,user:UserAttr) {
        return db_connection.cart.findFirst({
            where:!user||user.isAnonimus?{
                id:Number(cartId),
                user:null
            }:{
                user:{
                    id:user.id
                }
            },})
    }
    async function getCartWithProducts(cartId) {
        return await db_connection.cart.findFirst({
            where:{
                id:Number(cartId)
            },
            include:{
                variants:true
            }
        })
    }
    return Object.freeze({
        addToCart,
        removeFromCart,
        getCart
    });
   
    async function getCart(req:HttpRequest) {
        let {lang="ru",cartId=null} = {...req.query};
        let cart = await getUserCart(lang,cartId,req.user);
            
        if (cart==null) {
            cart = await createCart(lang,req.user)
        }
        
        if(cart.id!=cartId){
            let unconnectedCart = await getCartWithProducts(cartId);
            let exists = cart.variants.map(x=>x.id);
            cart=await db_connection.cart.update({
                where:{id:cart.id},
                data:{
                    variants:{
                        connect:unconnectedCart.variants.filter(x=>!exists.includes(x.id))
                    }
                },
                include:{
                    variants:{
                        include:{
                            product:{
                                include:{
                                    fields:{
                                        where:{
                                            language:{
                                                symbol:{
                                                    equals: lang,
                                                    mode: 'insensitive'
                                                }
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
                            },
                            
                        }
                    }
                }
            })
        }
        cart.variants.forEach(x=>{
            x.product.fields.forEach(async(field)=>{
                x.product[field.fieldName]=field.fieldValue
            })
            x.product.images?.forEach((image)=>{
                x.product['image'] = image.image;
            })
            delete x.product.images
            delete x.product.fields
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: cart
        }
    }
    async function addToCart(req:HttpRequest) {
        let{cartId=null}={...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let cart  = await getUserCartWithoutVariants(cartId,req.user)
        let variantsData = await db_connection.cart.update({
            where:{id:cart.id},
            data:{
                variants:{
                    connect:[{id:Number(variantId)}]
                }
            },
            include:{
                variants:{
                    include:{
                        product:{
                            include:{
                                fields:{
                                    where:{
                                        language:{
                                            symbol:{
                                                equals: lang,
                                                mode: 'insensitive'
                                            }
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
                        },
                        
                    }
                }
            }
        });
        variantsData.variants.forEach(x=>{
            x.product.fields.forEach(async(field)=>{
                x.product[field.fieldName]=field.fieldValue
            })
            x.product.images?.forEach((image)=>{
                x.product['image'] = image.image;
            })
            delete x.product.images
            delete x.product.fields
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: variantsData
        }
    }
    async function removeFromCart(req:HttpRequest) {
        let {cartId=null} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let cart  = await getUserCartWithoutVariants(cartId,req.user)
        let variantsData = await db_connection.cart.update({
            where:{id:cart.id},
            data:{
                variants:{
                    disconnect:{
                        id:Number(variantId)
                    }
                }
            },
            include:{
                variants:{
                    include:{
                        product:{
                            include:{
                                fields:{
                                    where:{
                                        language:{
                                            symbol:{
                                                equals: lang,
                                                mode: 'insensitive'
                                            }
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
                        },  
                    }
                }
            }
        })
        variantsData.variants.forEach(x=>{
            x.product.fields.forEach(async(field)=>{
                x.product[field.fieldName]=field.fieldValue
            })
            x.product.images?.forEach((image)=>{
                x.product['image'] = image.image;
            })
            delete x.product.images
            delete x.product.fields
        })
        return {
            status:StatusCodes.OK,
            message:"success",
            content: variantsData
        }
    }
}