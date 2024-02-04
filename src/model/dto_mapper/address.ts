import { AddressDto } from "@model/dto/address"
import { Address } from "@prisma/client"

const address_dto_mapper = {
    from: function(address: Address):AddressDto{
        return {
            id: address.id,
            mask:address.mask,
            userId:address.userId || "",
            apartment: address.apartment,
            building: address.building,
            city: address.city,
            comment: address.comment,
            company: address.company,
            country: address.country,
            firstName: address.firstName,
            lastName: address.lastName,
            street: address.street,
            type: address.type,
            zipCode: address.zipCode
        }
    }
}

export {address_dto_mapper}