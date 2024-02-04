import { PrismaClient,Prisma, Cart, CartVariants, Variant, Color } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {RequestUser} from '../common/request_user'
import Decimal from 'decimal.js';
import { BaseError } from '../exception';
import { cart_include } from './include/cart';
import { CartVariantWithProduct, CartWithVariants, ProductWithInfo } from '@abstract/types';

export default function make_cart_service(db_connection:PrismaClient){
    
    return Object.freeze({
        add_to_cart,
        remove_from_cart,
        get_cart,
        decrease_from_cart
    });

    function map_cart_to_response(cart: any) {
        cart.total = 0;
        let totalAmount = new Decimal(0);

        for (const variantItem of cart.variants) {
            const { variantId, variant, count } = variantItem;
            const { product } = variant;

            variantItem.id = variantId;
            variantItem.product = { ...product, image: product.images[0]?.image };
            product.fields.forEach((field:any) => variantItem.product[field.fieldName] = field.fieldValue);

            cart.total += count;
            totalAmount = totalAmount.add(new Decimal(count).mul(new Decimal(product.price)));
            
            variantItem.maxCount = variant.count;
            variantItem.size = variant.size;
            variantItem.color = variant.color;

            delete variantItem.variantId;
            delete variantItem.cartId;
            delete variantItem.variant;
            delete variantItem.product.fields;
            delete variantItem.product.images;
        }

        cart.totalAmount = totalAmount;
        return cart;
    }

    async function get_cart_by_id(lang:string,cartId:string) : Promise<CartWithVariants | null>{
        return await db_connection.cart.findFirst({
            where:{id:cartId},
            include:{variants:cart_include.get_cart_include(lang) }
        }) as CartWithVariants
    }

    async function get_cart_by_id_or_throw(lang:string,cartId:string) : Promise<CartWithVariants>{
        return await db_connection.cart.findFirstOrThrow({
            where:{id:cartId},
            include:{variants:cart_include.get_cart_include(lang) }
        }) as CartWithVariants
    }

    async function get_cart_variant(cartId:string,variantId:number):Promise<CartVariantWithProduct | null> {
        return await db_connection.cartVariants.findFirst({
            where:{cartId:cartId,variantId:Number(variantId),variant:{deleted:false}},
            include:{
                variant:{select:{count:true}}
            }
        }) as CartVariantWithProduct
    }
    
    async function get_variant_or_throw(variant_id: number):Promise<Variant> {
        return await db_connection.variant.findFirstOrThrow({
            where:{id: variant_id}
        })
    }

    async function create_cart(lang:string,user:RequestUser) {
        return await db_connection.cart.create({
            data:user.is_anonimus? {} :{ user: { connect: { id:user.id } } },
            include:{ variants: cart_include.get_cart_include(lang) }
        })
    }
    
    async function get_user_cart_without_variants(cartId:string,user:RequestUser) {
        return db_connection.cart.findFirst({
            where:!user||user.is_anonimus?
            {id:cartId,user:null}:{user:{id:user.id}}
        })
    }

    async function get_cart_with_variants(cart_id:string) {
        return await db_connection.cart.findFirst({
            where:{id:cart_id},
            include:{variants:true}
        })
    }
   
    async function get_cart(req:Request, res: Response) {
        let {lang="ru", cartId=""} = {...req.query};
        let cart = await db_connection.cart.upsert({
            where:{id:cartId},
            create:{
                user: req.body.authenticated_user.is_anonimus?null:req.body.authenticated_user.id,
            },
            update:{
                user: req.body.authenticated_user.is_anonimus?null:req.body.authenticated_user.id,
            },
            include:{variants:cart_include.get_cart_include(lang) }
        });
       
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }
    
    async function add_to_cart(req:Request, res: Response) {
        let{cart_id=""}={...req.params}
        let {variantId=0, lang="ru"} = {...req.query};

        let variant = await db_connection.variant.findFirstOrThrow({
            where:{id:Number(variantId), deleted:false}
        })
       
        let cart = await get_cart_by_id_or_throw(lang, cart_id)
        let cart_variant = await get_cart_variant(cart.id,variantId)
        
        // if (cart_variant==null){
        let cvariant = await db_connection.cartVariants.upsert({
            where:{variantId_cartId:{cartId:cart_id, variantId:variant.id}},
            create:{
                cartId: cart_id,
                variantId: variant.id,
                count:1
            },
            update:{
                cartId: cart_id,
                variantId: variant.id,
                count:cart_variant&&variant.count>=cart_variant.count+1?{
                    increment:1
                }:{}
            },
            include:{
                variant:cart_include.get_variant_include(lang)
            }
        }) as CartVariantWithProduct
        let ind = cart.variants.findIndex(x=>x.variantId==variantId)
        if (ind!=-1)
            cart.variants[ind].count+= cvariant.count;
        else
            cart.variants.push(cvariant)
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }

    async function remove_from_cart(req:Request, res: Response) {
        let {cart_id=""} = {...req.params}
       
        let {variantId=0, lang="ru"} = {...req.query};
        let cart = await get_cart_by_id_or_throw(lang, cart_id)
        let variant = await get_variant_or_throw(Number(variantId));
        cart = await db_connection.cart.update({
            where:{id:cart.id},
            data:{
                variants:{
                    delete:{
                        variantId_cartId:{ variantId:variant.id, cartId:cart.id }
                    }
                }
            },
            include:{variants:cart_include.get_cart_include(lang) }
        }) as CartWithVariants
         
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }

    async function decrease_from_cart(req:Request, res: Response) {
        let {cart_id=""} = {...req.params}
        let {variantId=0,lang="ru"} = {...req.query};
        let variant = await get_variant_or_throw(Number(variantId));
        let cart = await get_cart_by_id_or_throw(lang,cart_id)   
        let cart_variant = await get_cart_variant(cart.id, variantId)
       
        if(cart_variant!=null&&cart_variant.count==1){
            cart = await db_connection.cart.update({
                where:{id:cart.id},
                data:{
                    variants:{
                        delete:{
                            variantId_cartId:{ variantId:variant.id, cartId:cart_id }
                        }
                    }
                },
                include:{variants:cart_include.get_cart_include(lang) }
            }) as CartWithVariants 
        }
        else{
            await db_connection.cartVariants.update({
                where:{
                    variantId_cartId:{ cartId:cart.id, variantId:variant.id, }
                },
                data:{ count:{decrement:1} }
            })
            let ind = cart.variants.findIndex(x=>x.variantId==variantId)
            cart.variants[ind].count-=1; 
        }
         
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: map_cart_to_response(cart)
        })
    }
}