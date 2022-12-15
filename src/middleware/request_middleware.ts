import { Request,Response,NextFunction } from "express";
import {StatusCodes} from 'http-status-codes'
import {BaseError} from '../exception'
import {HttpRequest,HttpResponse} from '../common'

export default function req_middleware(controller:Function){
    return function call(req:Request,res:Response,next:NextFunction){
        let httpRequest = new HttpRequest(req.ip,req.path,req.body,req.query,req.cookies,req.params,req.method,{
            'Content-Type': req.get('Content-Type'),
          //   'Access-Control-Allow-Origin': 'http://localhost:3000',
          //   Referer: req.get('referer'),
            'User-Agent': req.get('User-Agent')
        })
        
        controller(httpRequest).then((httpResponse:HttpResponse) => {
      
            // if(httpResponse.cookie){
              
            //   res.cookie('token',httpResponse.cookie,{ sameSite: 'none', secure: true });
              
            // }    
            // res.type('json')
            return res.status(httpResponse.status).send(httpResponse)
        })
        .catch((err:Error) => {
            if (err instanceof BaseError){
                res.status(err.status)
                return res.send(err)       
            }
            console.log(err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            return res.send({status:StatusCodes.INTERNAL_SERVER_ERROR,message:err.message})
        })
    }
}