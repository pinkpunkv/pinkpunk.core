import { FileArray } from "express-fileupload";
import UserAttr from './user_attr'
export default class HttpRequest{
    ip: string;
    path: string;
    body: object;
    query: object;
    cookie: object;
    params: object;
    method: string;
    headers: object;
    sessionID: string
    files: FileArray
    user: UserAttr

    constructor( 
        ip: string,
        path: string,
        body: Object,
        query: Object,
        cookie: Object,
        params: Object,
        method: string,
        headers: Object,
        sessionID:string,
        user: any,
        files:FileArray=null){
        this.user = user
        this.files= files;
        this.body=body;
        this.cookie=cookie;
        this.query=query;
        this.params=params;
        this.ip=ip;
        this.method=method;
        this.path=path;
        this.headers=headers;
        this.sessionID=sessionID;
    }
}