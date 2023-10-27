export default class BaseError extends Error{
    status:number;
    message:string;
    errors:ErrorObject[];
   
    constructor(status:number,message:string,errors:ErrorObject[]){
        super(message)
        this.status =status;
        this.message = message;
        this.errors = errors;
    }
}

interface ErrorObject {
    code:string;
    message:string;   
}