import { FileArray } from "express-fileupload";

export default class HttpRequest{
    ip: string;
    path: string;
    body: object;
    query: object;
    cookie: object;
    params: object;
    method: string;
    headers: object;
    files: FileArray

    constructor( 
        ip: string,
        path: string,
        body: Object,
        query: Object,
        cookie: Object,
        params: Object,
        method: string,
        headers: Object,
        files:FileArray=null){

        this.files= files;
        this.body=body;
        this.cookie=cookie;
        this.query=query;
        this.params=params;
        this.ip=ip;
        this.method=method;
        this.path=path;
        this.headers=headers;
    }
}