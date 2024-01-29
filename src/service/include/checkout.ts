import { Prisma } from "@prisma/client"

const checkout_include = {
    get_variant_include:function get_include(lang: string) {
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
    },

    get_checkout_include:function get_checkout_include(lang:string){
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
            address:true,
            promo: true
        } as Prisma.CheckoutInclude
    }
}

export {checkout_include}