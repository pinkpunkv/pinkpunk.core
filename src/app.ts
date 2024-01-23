require("express-async-errors");
import 'reflect-metadata';
import express,{Express, NextFunction, Response, Request} from "express";
import {config} from './config'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import {product_router,product_admin_router,category_admin_router,category_router,
    variant_admin_router,collection_admin_router,collection_router,image_admin_router,
    language_admin_router,language_router,tag_admin_router,tag_router,user_router, user_admin_router, 
    cart_router, wish_list_router,address_router, checkout_router, checkout_admin_router,
    color_admin_router, size_admin_router, post_router, main_slider_router,
    promo_admin_router} from './routes'
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors'
import { user_status, has_role } from "./middleware";
import session from 'express-session'

import {asyncMiddleware} from 'middleware-async'
import { BaseError } from "./exception";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import {log_action} from "./middleware/log_action";
import { HttpValidationException } from "./common";

let app:Express = express();
app.use(express.json());
app.use(morgan('combined'))
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

var whitelist = ["http://localhost:3000","http://localhost:3001","http://localhost:3002","http://localhost:33555"]

app.use(cors({
   origin(requestOrigin, callback) {
    console.log(requestOrigin);
    callback(null, true)
    // if (requestOrigin&&whitelist.indexOf(requestOrigin) !== -1) {
    //     callback(null, true)
    // } else {
    //     callback(null, true)
    //     //callback(new Error('Not allowed by CORS'))
    // }
   }, 
}))
app.use(session({
    secret: config.SECRET!,
        resave: false,
        saveUninitialized: true,
        cookie: {          
            maxAge: 31536000000
        }
  }));

app.use(asyncMiddleware((req,res,next)=>{
    next()
}))

app.use(user_status)
app.use("/api/v1/admin/*", has_role("admin"))
app.use("/api/v1/admin/*", log_action())

app.use('/api/v1/address', address_router)

app.use('/api/v1/product', product_router)
app.use('/api/v1/admin/product', product_admin_router)

app.use('/api/v1/category', category_router)
app.use('/api/v1/admin/category', category_admin_router)

app.use('/api/v1/admin/variant', variant_admin_router)

app.use('/api/v1/collection', collection_router)
app.use('/api/v1/admin/collection', collection_admin_router)

app.use("/api/v1/admin/image", image_admin_router)

app.use('/api/v1/language', language_router)
app.use('/api/v1/admin/language', language_admin_router)

app.use('/api/v1/tag', tag_router)
app.use('/api/v1/admin/tag', tag_admin_router)

app.use('/api/v1/user', user_router)
app.use('/api/v1/admin/user',user_admin_router)

app.use('/api/v1/cart', cart_router)

app.use('/api/v1/wishList', wish_list_router)

app.use('/api/v1/checkout', checkout_router)
app.use('/api/v1/admin/checkout',checkout_admin_router)

app.use('/api/v1/admin/color', color_admin_router)
app.use('/api/v1/admin/size', size_admin_router)
app.use('/api/v1/admin/promo', promo_admin_router)

app.use('/api/v1', main_slider_router)
app.use('/api/v1/post', post_router)

app.use(function onError(err:Error, req:Request, res:Response, next:NextFunction) {
    console.log(err.stack);
    if (err instanceof Prisma.PrismaClientKnownRequestError){
      let message = err.message.split("\n");
      return res.status(StatusCodes.BAD_REQUEST).send({status:StatusCodes.BAD_REQUEST, message:message[message.length-1],content:err.meta})
    }
    if (err instanceof HttpValidationException){
        return res.status(err.status).send(err)
    }
    if (err instanceof BaseError){
        return res.status(err.status).send(err)
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({status:StatusCodes.INTERNAL_SERVER_ERROR, message:err.message})
  })
  
app.listen(config.PORT,()=>{
    console.log(`app listening on port ${config.PORT}`)
})
