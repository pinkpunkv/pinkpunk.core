import { HttpValidationException } from "src/public_api/common/index"
import { Type } from "class-transformer"
import { IsNotEmpty, validate } from "class-validator"
import Decimal from "decimal.js"

export class PromoDTO{
    @IsNotEmpty()
    code!: string
    @IsNotEmpty()
    @Type(() => Decimal)
    amount!: Decimal

    async validate(): Promise<PromoDTO>{
        return validate(this).then((err)=>{
            if (err.length>0) throw new HttpValidationException(err)
            return this
        })
    }
}