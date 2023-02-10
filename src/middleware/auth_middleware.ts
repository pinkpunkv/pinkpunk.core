import { NextFunction, Request, Response } from "express";
import {CustomerErrorCode} from '../common'

export default async function auth_middleware(req:Request,res:Response,next:NextFunction){

    if(req['userAttr'].isAnonimus)return res.status(401).send({status:401,code:CustomerErrorCode.TokenInvalid,"message":"Unauthorized"})
    
    return next()
}