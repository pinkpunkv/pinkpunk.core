import { HttpValidationException } from "../../public_api/common";
import { IValidate, ValidationErrorWithConstraints } from "../../abstract/types";
import { Checkout, DeliveryType, PaymentType } from "@prisma/client";
import { ValidationError } from "class-validator";

const parcel_order_validator: IValidate<Checkout> = {
    validate: async function (dto: Checkout, errors: ValidationError[]): Promise<ValidationError[]> {
        if (dto.paymentType!=PaymentType.online) errors.push(new ValidationErrorWithConstraints({"paymentType":"invalid paymnt type"}))
        if (!dto.addressId) errors.push(new ValidationErrorWithConstraints({"info":"billing info is required"}))
        return await errors;
    },
    validate_or_reject: async function (dto: Checkout, errors: ValidationError[]): Promise<Checkout> {
        return this.validate(dto, errors).then(err=>{
            if (err.length>0) throw new HttpValidationException(err)
            return dto
        })
    }
}

export {parcel_order_validator}