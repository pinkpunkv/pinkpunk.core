import { HttpValidationException } from "../../common";
import { IValidate } from "../../abstract/types";
import { Checkout, DeliveryType } from "@prisma/client";
import { ValidationError } from "class-validator";

const courier_order_validator: IValidate<Checkout> = {
    validate: async function (dto: Checkout, errors: ValidationError[]): Promise<ValidationError[]> {
       return await errors;
    },
    validate_or_reject: async function (dto: Checkout, errors: ValidationError[]): Promise<Checkout> {
        return this.validate(dto, errors).then(err=>{
            if (err.length>0) throw new HttpValidationException(err)
            return dto
        })
    },
}

export {courier_order_validator}