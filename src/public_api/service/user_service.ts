import { PrismaClient, Prisma, User } from '@prisma/client';
import { Request, Response } from "express";
//import redisClient from '../utils/connectRedis';
import bcrypt from 'bcryptjs'
import { BaseError } from '../exception';
import {StatusCodes} from 'http-status-codes'
import {CustomerErrorCode} from '../common'
import { checkout_include } from './include/checkout';
import { checkout_client_dto_mapper } from '@model/dto_mapper/checkout';
import { CheckoutWithExtraInfo } from '@abstract/types';
import { create_message_broker_connection } from 'src/helper';
import { sign_jwt, verify_jwt } from 'src/helper/utils/jwt';
import { SECRET } from '../env';
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../const';
import { generate_random_sha256 } from 'src/helper/utils/generate_token';


export default function make_user_service(db_connection:PrismaClient){

    return Object.freeze({
        register,
        login,
        get_user_info,
        update_user_info,
        forgot_password,
        confirm_change_password,
        confirm_user_registration,
        confirm,
        get_user_orders
    })
    
    
    async function register(req:Request, res: Response) {
        let password:String = req.body['password'];
        if (password.includes(" ")){
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,"EXPECTATION_FAILED",[{code:CustomerErrorCode.PasswordStartsOrEndsWithWhitespace,message:'Invalid password'}])
        }
        const hashedPassword = await bcrypt.hash(req.body['password'], SECRET)

        let user_ = await db_connection.user.findFirst({
            where:{
                email:{
                    equals:req.body['email']
                }
                
            }
        })
        if (user_!=null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'exists',[{code:CustomerErrorCode.Taken,message:"user already exists"}])
        let now = new Date().toISOString()
        let result = await db_connection.$transaction(async()=>{
            const user = await db_connection.user.create({
                data:{
                    username: req.body.username,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    phone: req.body.phone,
                    email: req.body.email,
                    sex: req.body.sex,
                    country:req.body.country,
                    password: hashedPassword,
                    createdAt:now,
                    updatedAt:now,
                    cart:{
                        create:{
    
                        }
                    },
                    wishList:{
                        create:{
                            
                        }
                    }
                }
            });
            let token = await db_connection.token.create({
                data:{
                    token:generate_random_sha256(),
                    type:"confirm",
                    objectId:user.id
                }
            })
            let rconn = await create_message_broker_connection()
            await rconn.publish_user_action("confirm", user.email, "BY", token.token)
            return user
        })
        
        
        return res.status(StatusCodes.CREATED).send({
            status:StatusCodes.CREATED,
            message:"success",
            content: result
        })
    }

    async function signTokens(user:User) {
        let accessToken = "bearer "+sign_jwt({id:user.id,role:user.role},"accessTokenPrivateKey",{expiresIn:ACCESS_TOKEN_EXPIRES_IN*24*60*60*1000})
        verify_jwt(accessToken.split(" ")[1],"accessTokenPrivateKey")
        return {access_token:accessToken,refresh_token:"bearer "+sign_jwt({id:user.id},"refreshTokenPrivateKey",{expiresIn:REFRESH_TOKEN_EXPIRES_IN*24*60*60*1000})}
    }

    

    async function findUniqueUser(where: Prisma.UserWhereUniqueInput,
        select?: Prisma.UserSelect) {
        return (await db_connection.user.findUnique({
            where,
            select,
          })) as User;
    }

    async function update_user_info(req:Request, res: Response) {
        let user = await db_connection.user.update({
            where:{id: req.body.authenticated_user.id },
            data:{
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
                updatedAt:new Date().toISOString()
            }
        })
        // Sign Tokens
        
        return res.status(StatusCodes.CREATED).send({
            status:StatusCodes.CREATED,
            message:"success",
            content: user
        })

    }
    
    async function login(req:Request, res:Response) {
        const { email='', password='' } = {...req.body};
        
        const user = await findUniqueUser(
            { email: email },
            { id: true, email: true, verified: true, password: true,role:true }
        );
        if(user==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"user not found"}])
        if (!(await bcrypt.compare(password, user.password))) {
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.Invalid,message:"invalid password"}])
        }

        // Sign Tokens
        const { access_token, refresh_token } = await signTokens(user);
        // set_cookie(res, access_token, refresh_token)
        return res.status(StatusCodes.CREATED).send({
            status:StatusCodes.CREATED,
            message:"success",
            content: {
                user:user,
                access_token:access_token,
                refresh_token:refresh_token
            }
        })

    }

    async function forgot_password(req:Request, res: Response) {
        let user = await findUniqueUser(
            { email: req.body.email }
        );
        if(user==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"user not found"}])
        let now = new Date()
        now.setMinutes(now.getMinutes()-1)
        
        let token = await db_connection.token.findFirst({
            where:{
                type:"forgot",
                createdAt:{
                    gte:now.toISOString()
                }
            }
        })
        if (token!=null)
            throw new BaseError(StatusCodes.TOO_MANY_REQUESTS,'',[{code:CustomerErrorCode.TooManyRequests,message:`please, try later`}])

        token = await db_connection.token.create({
            data:{
                token:generate_random_sha256(),
                type:"forgot",
                objectId:user.id,
                createdAt:new Date().toISOString()
            }
        })
        
        let rconn = await create_message_broker_connection()
        await rconn.publish_user_action("forgot", user.email, "BY", token.token)

        return res.status(StatusCodes.CREATED).send({
            status:StatusCodes.CREATED,
            message:"success",
            content: {}
        })
    }

    async function confirm_user_registration(req:Request, res: Response) {
        let ct = req.query.token!.toString()
        let token = await db_connection.token.findFirstOrThrow({
            where:{
                token:ct,
                type:"confirm"
            }
        })
        if(token==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])

        let result = await db_connection.$transaction(async()=>{
            await db_connection.user.update({
                where:{
                    id:token.objectId
                },
                data:{
                    status:"active"
                }
            })
            await db_connection.token.delete({
                where:{
                    token:token.token
                }
            })
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: result
        })
    }

    async function confirm(req:Request, res: Response) {
        
        let ct = req.query.token!.toString()
        let token = await db_connection.token.findFirstOrThrow({
            where:{
                token:ct,
                type:"confirm"
            }
        })
        if(token==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])
        let result = await db_connection.$transaction(async()=>{
            await db_connection.user.update({
                where:{
                    id:token.objectId
                },
                data:{
                    status:"active"
                }
            })
            await db_connection.token.delete({
                where:{
                    token:token.token
                }
            })
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: null
        })
    }

    async function confirm_change_password(req:Request, res: Response) {
        let ct = req.query.token!.toString()
        let token = await db_connection.token.findFirstOrThrow({
            where:{
                token:ct,
                type:"forgot"
            }
        })
        if(token==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])
        let newPass = req.body['password']
        let result = await db_connection.$transaction(async()=>{
            await db_connection.user.update({
                where:{
                    id:token.objectId
                },
                data:{
                    password:await bcrypt.hash(newPass,SECRET)
                }
            })
            await db_connection.token.delete({
                where:{
                    token:token.token
                }
            })
        })
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: result
        })
    }

    async function get_user_orders(req:Request, res: Response) {
        let {lang="ru"}= {...req.query}
        if (req.body.authenticated_user.is_anonimus)
            return {
                status:StatusCodes.OK,
                message:"success",
                content: []
            }
        let checkouts = await db_connection.checkout.findMany({
            where:{
                userId:req.body.authenticated_user.id,
                // status:{
                //     in:["delivered","pending","completed"]
                // }
            },
            include:checkout_include.get_checkout_include(lang)
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: checkouts.map(x=>checkout_client_dto_mapper.from(x as CheckoutWithExtraInfo))
        })
    }

    async function get_user_info(req:Request, res: Response) {    
        let user = await findUniqueUser(
            { id: req.body.authenticated_user.id }
        );
        let orders = await db_connection.checkout.findMany({
            where:{
                OR:{
                    userId:user.id,
                    info:{
                        email:user.email
                    }
                }
            }
        })

        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: user  
        })

    }
}

