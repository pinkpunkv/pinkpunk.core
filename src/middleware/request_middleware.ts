import { Request,Response,NextFunction,CookieOptions } from "express";
import {StatusCodes} from 'http-status-codes'
import {BaseError} from '../exception'
import {HttpRequest,HttpResponse} from '../common'
import  {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {config} from '../config'

const cookiesOptions: CookieOptions = {
    httpOnly: true,
    sameSite: "none",
  };
  
if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;


const accessTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.accessTokenExpiresIn*24*60*60*1000
    ),
    maxAge: config.accessTokenExpiresIn*24*60*60*1000,
};


const refreshTokenCookieOptions: CookieOptions = {
    ...cookiesOptions,
    expires: new Date(
        Date.now() + config.refreshTokenExpiresIn*24*60*60*1000
    ),
    maxAge: config.refreshTokenExpiresIn*24*60*60*1000,
};


export default function req_middleware(controller:Function){
    
    
    return function call(req:Request,res:Response,next:NextFunction){
        
        let httpRequest = new HttpRequest(req.ip,req.path,req.body,req.query,req.cookies,req.params,req.method,{
            'Content-Type': req.get('Content-Type'),
          //   'Access-Control-Allow-Origin': 'http://localhost:3000',
          //   Referer: req.get('referer'),
            'User-Agent': req.get('User-Agent')
        },req['sessionID'],req['userAttr'],req.files)

        controller(httpRequest).then((httpResponse:HttpResponse) => {
            console.log(httpRequest.user);
            
            // if(httpResponse.cookie){
              
            //   res.cookie('token',httpResponse.cookie,{ sameSite: 'none', secure: true });
            // }    
            // res.type('json')
            if(httpResponse.cookies){
                res.cookie('p_act', httpResponse.cookies.access_token, accessTokenCookieOptions);
                res.cookie('p_rft', httpResponse.cookies.refresh_token, refreshTokenCookieOptions);
                res.cookie('lin', true, {...accessTokenCookieOptions,httpOnly: false,});
                delete httpResponse.cookies
            }
            return res.status(httpResponse.status).send(httpResponse)
        })
        .catch((err:Error) => {
            console.log(err);
            
            if (err instanceof BaseError){
                res.status(err.status)
                return res.send(err)       
            }
            if(err instanceof PrismaClientKnownRequestError){
                let message = err.message.split("\n");
                res.status(StatusCodes.EXPECTATION_FAILED)
                return res.send({status:StatusCodes.EXPECTATION_FAILED,message:message[message.length-1],content:err.meta})
            }
            
            res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            return res.send({status:StatusCodes.INTERNAL_SERVER_ERROR,message:err.message})
        })
    }
}