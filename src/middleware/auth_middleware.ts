import { NextFunction, Request, Response } from "express";

export default function auth_middleware(req:Request,res:Response,next:NextFunction){
    next()
}