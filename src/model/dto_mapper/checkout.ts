import { CheckoutVariantInfo, CheckoutWithExtraInfo, CheckoutWithInfo } from "@abstract/types";
import { CheckoutClientResponseDto, CheckoutVariantDto } from "@model/dto/checkout";
import { product_client_dto_mapper } from "./product";
import Decimal from "decimal.js";

const checkout_client_dto_mapper = {
    from: function(checkout: CheckoutWithExtraInfo):CheckoutClientResponseDto{
        let dto = new CheckoutClientResponseDto()
        for(const variant of checkout.variants){
            dto.variants.push(checkout_variant_client_dto_mapper.from(variant))
            dto.total+=variant.count
            dto.baseTotalAmount = dto.baseTotalAmount.add(new Decimal(variant.count).mul(new Decimal(variant.variant.product.price)))
        }
        dto.totalAmount = checkout.promo?dto.baseTotalAmount.mul(new Decimal(1).minus(checkout.promo.amount)):dto.baseTotalAmount
        return dto
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