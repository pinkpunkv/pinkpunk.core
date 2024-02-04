import { HttpValidationException } from "@common/index"
import { ValidationError, validate } from "class-validator"

export async function validate_dto_or_reject<T extends object>(entity:T): Promise<T>{
    return validate(entity).then(async(err)=>{
        if (err.length>0) throw new HttpValidationException(err)
        return entity
    })
}

export async function validate_dto<T extends object>(entity:T): Promise<ValidationError[]>{
    return await validate(entity)
}