import Decimal from "decimal.js"
import { ProductClientDto } from "./product"
import { AddressDto } from "./address"
import { DeliveryType, PaymentType } from "@prisma/client"

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
    id!: string
    total: number = 0
    orderId!: number
    paymentType!: PaymentType
    deliveryType!: DeliveryType
    baseTotalAmount: Decimal = new Decimal(0)
    totalAmount: Decimal = new Decimal(0)
    currencySymbol: string = "BYN"
    address?: AddressDto
    info?: CheckoutInfoDto
    variants: CheckoutVariantDto[] = []
}