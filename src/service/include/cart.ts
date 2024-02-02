import { Prisma } from "@prisma/client"

const cart_include = {

    get_cart_include:function (lang:string):Prisma.CartVariantsFindManyArgs{
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
                                    // where:{
                                    //     isMain:true
                                    // },
                                    select:{
                                        image:{
                                            select:{
                                                url:true
                                            }
                                        }
                                    },
                                    orderBy:{
                                        number:"asc"
                                    },
                                }
                            }
                        },
                        color:true,
                        images:{
                            take:1
                        }
                    },
                },
            },
            where:{
                variant:{
                    product:{
                        deleted:false
                    }
                }
            },
            orderBy:{variantId:"desc"}
        } 
    }
}

export {cart_include}