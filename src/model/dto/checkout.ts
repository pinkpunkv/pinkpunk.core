import Decimal from "decimal.js"
import { ProductClientDto } from "./product"

export class CheckoutInfoDto{
    email: string
    phone: string
    firstName: string | null
    lastName: string | null
    comment: string | null

    constructor(model:any){
        this.email = model?.email || ""
        this.phone = model?.phone || ""
        this.firstName = model?.firstName
        this.lastName = model?.lastName
        this.comment = model?.comment
    }
}

export class CheckoutVariantColor{
    id!: number
    color!: string
    colorText!: string | null
}
export class CheckoutVariantDto{
    id!: number
    product!: ProductClientDto
    count!: number
    color!: CheckoutVariantColor
    maxCount!: number
    size!: string
}

export class CheckoutClientResponseDto{
    total: number = 0
    totalAmount: Decimal = new Decimal(0)
    currencySymbol: string = "BYN"
    info?: CheckoutInfoDto
    variants: CheckoutVariantDto[] = []
}