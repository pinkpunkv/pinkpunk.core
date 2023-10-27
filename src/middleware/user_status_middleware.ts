import { NextFunction, Request, Response } from "express";
import { verify_jwt } from "../utils/jwt";

export default async function user_status_middleware(req:Request,res:Response,next:NextFunction){
    let act:string|undefined = req.headers.authorization;

    if(!act){req.body.authenticated_user = {is_anonimus:true}; return next()}
    try{
   
        let verified = verify_jwt(act.split(' ')[1],"accessTokenPrivateKey");

        req.body.authenticated_user = {id:verified.id, is_anonimus:false, role:verified.role}
        return next()
    }
    catch (e){
        console.log(e);
        
        req.body.authenticated_user = {is_anonimus:true}
        return next()
    }
}