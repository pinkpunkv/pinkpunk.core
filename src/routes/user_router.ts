import express from'express'
import {user_service} from '../service'
import {validate,auth_middleware} from '../middleware'
import {createUserSchema,loginSchema} from '../schemas/user.schema'
let user_router = express.Router();

user_router.post('/register',validate(createUserSchema),user_service.register)
user_router.post('/password/forgot',user_service.forgot_password)
user_router.post('/password/confirm',user_service.confirm_change_password)
user_router.post('/confirm',user_service.confirm)
user_router.post('/login',validate(loginSchema),user_service.login)
user_router.put('/info',auth_middleware,user_service.update_user_info)
user_router.get('/info',auth_middleware,user_service.get_user_info)

export default user_router;
