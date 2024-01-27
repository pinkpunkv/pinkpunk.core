import { CheckoutVariantInfo, CheckoutWithExtraInfo, CheckoutWithInfo } from "@abstract/types";
import { CheckoutClientResponseDto, CheckoutInfoDto, CheckoutVariantDto } from "@model/dto/checkout";
import { product_client_dto_mapper } from "./product";
import Decimal from "decimal.js";
import { CheckoutInfo } from "@prisma/client";
import { address_dto_mapper } from "./address";

const checkout_client_dto_mapper = {
    from: function(checkout: CheckoutWithExtraInfo):CheckoutClientResponseDto{
        let dto = new CheckoutClientResponseDto()
        dto.id = checkout.id
        dto.deliveryType = checkout.deliveryType
        dto.paymentType = checkout.paymentType
        dto.orderId = checkout.orderId
        dto.info = checkout.info?checkout_info_mapper.from(checkout.info):undefined
        dto.address = checkout.address?address_dto_mapper.from(checkout.address):undefined
        for(const variant of checkout.variants){
            dto.variants.push(checkout_variant_client_dto_mapper.from(variant))
            dto.total+=variant.count
            dto.baseTotalAmount = dto.baseTotalAmount.add(new Decimal(variant.count).mul(new Decimal(variant.variant.product.price)))
        }
        dto.totalAmount = checkout.promo?dto.baseTotalAmount.mul(new Decimal(1).minus(checkout.promo.amount)):dto.baseTotalAmount
        return dto
    }
}
const checkout_info_mapper = {
    from: function(info: CheckoutInfo):CheckoutInfoDto{
        return {
            firstName: info.firstName,
            comment: info.comment,
            email: info.email,
            lastName: info.lastName,
            phone: info.phone
        }
    }
}
const checkout_variant_client_dto_mapper = {
    from: function(checkout: CheckoutVariantInfo):CheckoutVariantDto{
        return {
            color: checkout.variant.color,
            count: checkout.count,
            id: checkout.variant.id,
            maxCount: checkout.variant.count,
            product: product_client_dto_mapper.from(checkout.variant.product),
            size: checkout.variant.size
        }
    }
}

export {checkout_client_dto_mapper, checkout_variant_client_dto_mapper}