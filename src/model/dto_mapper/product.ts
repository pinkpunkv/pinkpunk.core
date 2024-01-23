import { CheckoutVariantInfo, ProductMessageDto, ProductWithInfo } from "@abstract/types";
import { ProductClientDto } from "@model/dto/product";

const product_client_dto_mapper = {
    from: function(product: ProductWithInfo):ProductClientDto{
        let dto = new ProductClientDto()
        dto.id = product.id,
        dto.basePrice = product.basePrice,
        dto.collectionId = product.collectionId,
        dto.currencySymbol = product.currencySymbol,
        dto.image = product.images[0].image,
        dto.price = product.price,
        dto.sex = product.sex,
        dto.slug = product.slug,
        dto.views = product.views
        for (const field of product.fields)
            dto[field.fieldName] = field.fieldValue
        return dto
    }
}

const product_message_dto_mapper = {
    from: function(checkout_variant: CheckoutVariantInfo):ProductMessageDto{
        let product = checkout_variant.variant.product
        return {
            name:product.fields.filter((x:any)=>x.fieldName=="name")[0],
            color:checkout_variant.variant.color.colorText,
            size:checkout_variant.variant.size,
            basePrice:product.basePrice.toNumber(),
            price:product.price.toNumber(),
            count:checkout_variant.count,
            image:product.images[0].image.url
        }
    }
}

export {product_client_dto_mapper, product_message_dto_mapper}