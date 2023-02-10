export default class BaseError extends Error{
    status:number;
    code:string;
    message:string;
    content:Object;
    constructor(status:number,code:string,message:string,content:Object){
        super(message)
        this.status =status;
        this.message = message;
        this.code = code;
        this.content = content;
    }
}