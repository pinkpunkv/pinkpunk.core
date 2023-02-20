import express from'express'
import {user_service} from '../service'
import {req_middleware as m,validate,auth_middleware} from '../middleware'
import {createUserSchema,loginUserSchema} from '../schemas/user.schema'
let user_router = express.Router();

user_router.post('/register',validate(createUserSchema),m(user_service.registerUser))
user_router.post('/login',validate(loginUserSchema),m(user_service.loginUser))
user_router.put('/info',auth_middleware,m(user_service.updateUserInfo))
user_router.get('/info',auth_middleware,m(user_service.getUserInfo))


export default user_router;
