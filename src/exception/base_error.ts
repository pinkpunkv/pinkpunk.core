export default class BaseError extends Error{
    status:number;
    message:string;
    content:Object;
    constructor(status:number,message:string,content:Object){
        super(message)
        this.status =status;
        this.message = message;
        this.content = content;
    }
}