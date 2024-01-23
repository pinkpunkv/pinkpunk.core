import { Address, AddressFields, Checkout, CheckoutInfo, CheckoutVariants, Color, Field, Product, ProductsImages, PromoCode, Tag, Variant } from "@prisma/client"
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
export type CheckoutVariantInfo = CheckoutVariants&{variant:Variant&{product:ProductWithInfo, color: Color}}
export type CheckoutWithExtraInfo = Checkout&{
    variants: CheckoutVariantInfo[];
    info: CheckoutInfo | null,
    address: Address & {fields: AddressFields[]} | null;
    promo: PromoCode | null
}