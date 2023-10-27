import { NextFunction, Request, Response } from "express";
import {db} from '../database'

let db_connection = db();
let loggable_methods = ['post', 'put', 'delete']
export default function log_middleware(){
    return async (req:Request,res:Response,next:NextFunction) => {
        next()
        if (req.method in loggable_methods && res.statusCode >= 200 && res.statusCode < 300)
            await db_connection.adminLog.create({
                data:{
                    data:JSON.stringify({...req.body, ...req.query}),
                    request: req.url,
                    userId:req.body.authenticated_user.id,
                    timestamp: Date.now()
                }
            })
    }
}