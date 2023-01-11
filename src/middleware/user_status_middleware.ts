import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt";

export default async function user_status_middleware(req:Request,res:Response,next:NextFunction){
    let act:string = req.cookies.p_act;
    
    if(!act){req['userAttr'] = {isAnonimus:true}; return next()}
    try{
        let verified = await verifyJwt(act.split(' ')[1],"accessTokenPrivateKey");
        req['userAttr'] = {id:verified['id'], isAnonimus:false, role:verified['role']}
        return next()
    }
    catch{
        req['userAttr'] = {isAnonimus:true}
        return next()
    }
}