import { PrismaClient, Prisma, User } from '@prisma/client';
import { HttpRequest } from "../common";
import {config} from '../config';
//import redisClient from '../utils/connectRedis';
import { signJwt, verifyJwt } from '../utils/jwt';
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generate_token';
import { BaseError } from '../exception';
import {StatusCodes} from 'http-status-codes'
import {CustomerErrorCode} from '../common'
import { createRabbitMQConnection } from '../helper';
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_user_service(db_connection:PrismaClient){

    return Object.freeze({
        registerUser,
        loginUser,
        getUserInfo,
        updateUserInfo,
        forgotPassword,
        confirmChangePassword,
        confirmUserRegistration,
        confirmReg
    })
    
    
    async function registerUser(req:HttpRequest) {
        let password:String = req.body['password'];
        if (password.includes(" ")){
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,"EXPECTATION_FAILED",[{code:CustomerErrorCode.PasswordStartsOrEndsWithWhitespace,message:'Invalid password'}])
        }
        const hashedPassword = await bcrypt.hash(req.body['password'],config.SECRET)

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
        let res = await db_connection.$transaction(async()=>{
            const user = await db_connection.user.create({
                data:{
                    username: req.body['username'],
                    firstName: req.body['firstName'],
                    lastName: req.body['lastName'],
                    phone: req.body['phone'],
                    email: req.body['email'],
                    sex: req.body['sex'],
                    country:req.body['country'],
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
                    token:generateToken(),
                    type:"confirm",
                    objectId:user.id
                }
            })
            let rconn = await createRabbitMQConnection()
            await rconn.sendMessage("user",JSON.stringify({email:user.email,type:"confirm",ct:token.token}))
            return user
        })
        
        
        return {
            status: StatusCodes.CREATED,
            message:"success",
            content: res
        }
    }

    async function signTokens(user:User) {
        let accessToken = "bearer "+signJwt({id:user.id,role:user.role},"accessTokenPrivateKey",{expiresIn:config.accessTokenExpiresIn*24*60*60*1000})
        verifyJwt(accessToken.split(" ")[1],"accessTokenPrivateKey")
        return {access_token:accessToken,refresh_token:"bearer "+signJwt({id:user.id},"refreshTokenPrivateKey",{expiresIn:config.refreshTokenExpiresIn*24*60*60*1000})}
    }

    

    async function findUniqueUser(where: Prisma.UserWhereUniqueInput,
        select?: Prisma.UserSelect) {
        return (await db_connection.user.findUnique({
            where,
            select,
          })) as User;
    }

    async function updateUserInfo(req:HttpRequest) {
        let user = await db_connection.user.update({
            where:{id: req.user.id },
            data:{
                firstName: req.body['firstName'],
                lastName: req.body['lastName'],
                phone: req.body['phone'],
                updatedAt:new Date().toISOString()
            }
        })
        // Sign Tokens
        
        return {
            status: StatusCodes.CREATED,
            message:"success",
            content: user
        }

    }
    async function loginUser(req:HttpRequest) {
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
        
        return {
            status: StatusCodes.CREATED,
            message:"success",
            cookies:{
                access_token:access_token,
                refresh_token:refresh_token
            },
            content: {
                user:user,
                access_token:access_token,
                refresh_token:refresh_token
            }
        }

    }

    async function forgotPassword(req:HttpRequest) {
        let user = await findUniqueUser(
            { email: req.body['email'] }
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
                token:generateToken(),
                type:"forgot",
                objectId:user.id,
                createdAt:new Date().toISOString()
            }
        })
        let rconn = await createRabbitMQConnection()
        await rconn.sendMessage("user",JSON.stringify({email:user.email,type:"forgot",ct:token.token}))

        return {
            status: StatusCodes.OK,
            message:"success",
            content: {}
        }
    }

    async function confirmUserRegistration(req:HttpRequest) {
        let ct = req.query['token']
        let token = await db_connection.token.findFirst({
            where:{
                token:ct,
                type:"confirm"
            }
        })
        if(token==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])

        let res = await db_connection.$transaction(async()=>{
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
        return {
            status: StatusCodes.OK,
            message:"success",
            content: res
        }
    }
    async function confirmReg(req:HttpRequest) {
        
        let ct = req.query['token']
        let token = await db_connection.token.findFirst({
            where:{
                token:ct,
                type:"confirm"
            }
        })
        if(token==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])
        let res = await db_connection.$transaction(async()=>{
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
        return {
            status: StatusCodes.OK,
            message:"success",
            content: res
        }
    }
    async function confirmChangePassword(req:HttpRequest) {
        
        let ct = req.query['token']
        let token = await db_connection.token.findFirst({
            where:{
                token:ct,
                type:"forgot"
            }
        })
        if(token==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,'',[{code:CustomerErrorCode.UnidentifiedCustomer,message:"invalid token"}])
        let newPass = req.body['password']
        let res = await db_connection.$transaction(async()=>{
            await db_connection.user.update({
                where:{
                    id:token.objectId
                },
                data:{
                    password:await bcrypt.hash(newPass,config.SECRET)
                }
            })
            await db_connection.token.delete({
                where:{
                    token:token.token
                }
            })
        })
        return {
            status: StatusCodes.OK,
            message:"success",
            content: res
        }
    }
    async function getUserInfo(req:HttpRequest) {
        
        let user = await findUniqueUser(
            { id: req.user.id }
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

        return {
            status: StatusCodes.CREATED,
            message:"success",
            content: user
            
        }

    }
}
