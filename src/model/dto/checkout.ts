import Decimal from "decimal.js"
import { ProductClientDto } from "./product"
import { AddressDto } from "./address"
import { CheckoutStatus, DeliveryType, PaymentType } from "@prisma/client"
import { Exclude, Expose, Transform, Type } from "class-transformer"
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CheckoutInfoDTO{
    @IsString()
    email!: string | ""

    @IsString()
    phone!: string | ""

    @IsOptional()
    firstName?: string | null

    @IsOptional()
    lastName?: string | null

    @IsOptional()
    comment?: string | null
}

export class CheckoutClientUpdateDTO{
    @IsString()
    @IsIn(Object.values(PaymentType))
    paymentType: PaymentType = PaymentType.cash

    @IsString()
    @IsIn(Object.values(DeliveryType))
    deliveryType: DeliveryType = DeliveryType.pickup
}
export class CheckoutVariantConnectDto{
    // @Expose()
    // id!: number
    @Transform(({value})=>value.id)
    @IsNotEmpty()
    variantId!: number

    @IsNotEmpty()
    @IsInt()
    count!: number
}
export class CheckoutDTO{
    @IsString()
    @IsIn(Object.values(CheckoutStatus))
    status: CheckoutStatus = CheckoutStatus.pending

    @Type(()=>CheckoutInfoDTO)
    info?: CheckoutInfoDTO

    @Type(()=>AddressDto)
    address?: AddressDto

    @IsString()
    @IsIn(Object.values(PaymentType))
    paymentType: PaymentType = PaymentType.cash

    @IsString()
    @IsIn(Object.values(DeliveryType))
    deliveryType: DeliveryType = DeliveryType.pickup

    @Type(() => CheckoutVariantConnectDto)
    variants: CheckoutVariantConnectDto[] = []
}

export class CheckoutVariantColor{
    id!: number
    color!: string
    colorText!: string | null
}

export class CheckoutVariantDTO{
    id!: number
    product!: ProductClientDto
    count!: number
    color!: CheckoutVariantColor
    maxCount!: number
    size!: string
}

export class CheckoutClientResponseDTO{
    id!: string
    total: number = 0
    orderId!: number
    paymentType!: PaymentType
    deliveryType!: DeliveryType
    baseTotalAmount: Decimal = new Decimal(0)
    totalAmount: Decimal = new Decimal(0)
    currencySymbol: string = "BYN"
    address?: AddressDto
    info?: CheckoutInfoDTO
    variants: CheckoutVariantDTO[] = []
}