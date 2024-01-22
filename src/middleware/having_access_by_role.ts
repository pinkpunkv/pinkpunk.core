import { NextFunction, Request, Response } from "express";
import {CustomerErrorCode} from '../common'

export function has_role(role:String){
    return async (req:Request,res:Response,next:NextFunction) => {

        if(req.body.authenticated_user.is_anonimus||req.body.authenticated_user.role != role)return res.status(403).send({status:403,code:CustomerErrorCode.Forbidden,"message":"Forbidden"})
        
        next()
    }
}