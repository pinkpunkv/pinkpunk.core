import { PrismaClient, Prisma, User } from '@prisma/client';
import { HttpRequest } from "../common";
import {config} from '../config';
//import redisClient from '../utils/connectRedis';
import { signJwt } from '../utils/jwt';
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { BaseError } from '../exception';
import {StatusCodes} from 'http-status-codes'
import {CustomerErrorCode} from '../common'
export const excludedFields = ['password', 'verified', 'verificationCode'];


export default function make_user_service(db_connection:PrismaClient){

    return Object.freeze({
        registerUser,
        loginUser
    })

    async function registerUser(req:HttpRequest) {
        let password:String = req.body['password'];
        if (password.includes(" ")){
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,CustomerErrorCode.PasswordStartsOrEndsWithWhitespace,'Invalid password',null)
        }
        const hashedPassword = await bcrypt.hash(req.body['password'],config.SECRET)

        const verifyCode = crypto.randomBytes(32).toString('hex');
        
        const verificationCode = crypto
          .createHash('sha256')
          .update(verifyCode)
          .digest('hex');
        let user_ = await db_connection.user.findFirst({
            where:{
                email:{
                    equals:req.body['email']
                }
                
            }
        })
        if (user_!=null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,CustomerErrorCode.Taken,'',null)
        const user = await db_connection.user.create({
            data:{
                name: req.body['name'],
                email: req.body['email'],
                sex: req.body['sex'],
                country:req.body['country'],
                password: hashedPassword,
                verificationCode:verificationCode,
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
    
        return {
            status: StatusCodes.CREATED,
            message:"success",
            content: user
        }
    }

    async function signTokens(user:User) {
        let accessToken = "bearer "+signJwt({id:user.id,role:user.role},"accessTokenPrivateKey",{expiresIn:config.accessTokenExpiresIn*24*60*60*1000})
        return {access_token:accessToken,refresh_token:"bearer "+signJwt({id:user.id},"refreshTokenPrivateKey",{expiresIn:config.refreshTokenExpiresIn*24*60*60*1000})}
    }

    async function findUniqueUser(where: Prisma.UserWhereUniqueInput,
        select?: Prisma.UserSelect) {
        return (await db_connection.user.findUnique({
            where,
            select,
          })) as User;
    }

    async function loginUser(req:HttpRequest) {
        const { email='', password='' } = {...req.body};
        
        const user = await findUniqueUser(
            { email: email },
            { id: true, email: true, verified: true, password: true,role:true }
        );
        if(user==null)
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,CustomerErrorCode.UnidentifiedCustomer,'',{})
        if (!(await bcrypt.compare(password, user.password))) {
            throw new BaseError(StatusCodes.EXPECTATION_FAILED,CustomerErrorCode.Invalid,'',{})
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
                access_token:access_token,
                refresh_token:refresh_token
            }
        }

    }
}
