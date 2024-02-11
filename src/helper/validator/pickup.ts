import { HttpValidationException } from "../../public_api/common";
import { IValidate } from "../../abstract/types";
import { Checkout, DeliveryType } from "@prisma/client";
import { ValidationError } from "class-validator";

const pickup_order_validator: IValidate<Checkout> = {
    validate: async function (dto: Checkout, errors: ValidationError[]): Promise<ValidationError[]> {
       return await errors;
    },
    validate_or_reject: async function (dto: Checkout, errors: ValidationError[]): Promise<Checkout> {
        return this.validate(dto, errors).then(err=>{
            if (err.length>0) throw new HttpValidationException(err)
            return dto
        })
    }
}

export {pickup_order_validator}