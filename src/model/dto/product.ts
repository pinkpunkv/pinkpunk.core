import Decimal from "decimal.js"

export class ProductClientDto{
    id!: number
    path!:string
    slug!: string
    price!: Decimal
    basePrice!: Decimal
    sex!: string
    views!: Decimal
    currencySymbol!: string | null
    collectionId!: number | null
    image!: {url:string}
    [key:string]: any 
}