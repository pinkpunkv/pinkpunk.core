import { NextFunction, Request, Response } from "express";

export default async function auth_middleware(req:Request,res:Response,next:NextFunction){
    if(!req['userAttr'].isAnonimus)return res.status(401).send({status:401,"message":"access denied"})
    
    return next()
}