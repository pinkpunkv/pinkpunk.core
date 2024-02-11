import { ValidationError } from 'class-validator';

export * from "./http_response"
export * from './chackout_enum'
export * from './customer_enum'

export class HttpValidationException extends Error{
    status = 417;
    message: string = "VALIDATION_EXCEPTION"
    data?: any;

    constructor(err:ValidationError[]){
        super();
        this.data = err.reduce((errors:Array<string>, x: ValidationError)=>errors.concat(Object.values(x.constraints!)),[])
    }
}