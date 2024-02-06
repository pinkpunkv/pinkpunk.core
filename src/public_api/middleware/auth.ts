import { CustomerErrorCode } from "@common/customer_enum";
import { NextFunction, Request, Response } from "express";

export async function authenticated_or_reject(req:Request,res:Response,next:NextFunction){

    if(req.body.authenticated_user.is_anonimus)return res.status(401).send({status:401,code:CustomerErrorCode.TokenInvalid,"message":"Unauthorized"})
    
    return next()
}