import { Address, AddressFields, Cart, CartVariants, Checkout, CheckoutInfo, CheckoutVariants, Color, Field, Prisma, Product, ProductsImages, PromoCode, Tag, Variant } from "@prisma/client"
import { ValidationError } from "class-validator"

export interface ProductNameDto {
    id: number
    fieldName: string,
    fieldValue: string,
    languageId: number
}

export interface ProductMessageDto{
    name: ProductNameDto
    color: string | null
    size: string
    basePrice: number
    price: number
    count: number
    image: string
}

export interface CheckoutUserInfoDto{
    contactFL:string
    email:string
    phone:string
    addressFL:string
    address:string
    postalCode:string
    city:string
    country: string
}

export interface CheckoutMessageDto{
    info:CheckoutUserInfoDto
    orderId:number
    products:ProductMessageDto[]
    productsCount:number
    total:string
    deliveryPrice:string
    discount:string
    finalTotal:string    
}

export interface ICRUD<T,ID>{
    create(entity:T):Promise<T>;
    update(id:ID, entity:T):Promise<T>;
    remove(id:ID):Promise<T>;
    get(id:ID):Promise<T>;
    get_all(params:PaginationParams):Promise<T[]>;
}



export interface TokenData{
    access_token: string
    token_type: string
    expires_in: number
    expires_at: number
}

export interface MainSliderDto{
    title: string
    title2: string
    mainButtonText: string
    mainButtonLink: string

    subtitle: string
    subtitleDesc: string
    subtitleButtonText: string
    subtitleButtonLink: string
    products: number[]
}

export class ValidationErrorWithConstraints extends ValidationError{
    constructor(constraints?: {
        [type: string]: string;
    }){
        super();
        this.constraints = constraints
    }
}

export interface IValidate<T>{
    validate(entity:T, errors: ValidationError[]):Promise<ValidationError[]>;
    validate_or_reject(entity:T, errors: ValidationError[]):Promise<T>;
}

export type ProductWithInfo = Product&{fields:Field[], images: {image:{url:string}}[], tags: Tag[]}
export type CheckoutWithInfo = Checkout&{
    variants: CheckoutVariants[];
    info: CheckoutInfo | null,
    address: Address | null;
}
export type CartVariantWithProduct = { cartId: string, count: number, variantId: number, variant:Variant&{product:ProductWithInfo, color: Color}}
export type CartWithVariants = Cart & { variants: CartVariantWithProduct[]};

export type CheckoutVariantId = Prisma.CheckoutVariantsCheckoutIdVariantIdCompoundUniqueInput

export type CheckoutVariantInfo = CheckoutVariants&{variant:Variant&{product:ProductWithInfo, color: Color}}

export type CheckoutWithExtraInfo = Checkout&{
    variants: CheckoutVariantInfo[];
    info: CheckoutInfo | null,
    address: Address | null;
    promo: PromoCode | null
}

export class PaginationParams{
    take: number
    skip: number
    require_total: boolean
    constructor(take: number, skip: number, require_total: boolean){
        this.take = take
        this.skip = skip
        this.require_total = require_total
    }

    static parse(source: any): PaginationParams{
        return new PaginationParams(
            Number(source['take']||10),
            Number(source['skip']||0),
            Boolean(source['require_total'])
        )
    }
}

export class PaginationResponseWrapper{
    items: any[]
    total: number
    constructor(items:any[], total:number){
        this.items = items
        this.total = total
    }
}
