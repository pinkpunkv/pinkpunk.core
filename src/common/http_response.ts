export default class HttpResponse{
    status:number;
    message:string;
    cookies:any;
    content:string;

    constructor(status:number,message:string,content:string){
        this.status=status;
        this.message=message;
        this.content=content;
    }
}