export interface ProductName {
    id: number
    fieldName: string,
    fieldValue: string,
    languageId: number
}

export interface ProductMessage{
    name: ProductName
    color: string
    size: string
    basePrice: number
    price: number
    count: number
    image: string
}

export interface CheckoutMessageInfo{
    contactFL:string
    email:string
    phone:string

    addressFL:string
    address:string
    postalCode:string
    city:string
    country: string
}

export interface CheckoutMessage{
    info:CheckoutMessageInfo
    orderId:number
    products:Array<ProductMessage>
    productsCount:number
    total:string
    deliveryPrice:string
    discount:string
    finalTotal:string    
}
