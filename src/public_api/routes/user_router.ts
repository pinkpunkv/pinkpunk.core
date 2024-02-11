import express from'express'
import {user_service} from '../service'
import {validate,authenticated_or_reject} from '../middleware'
// import {createUserSchema,loginSchema} from '../schemas/user.schema'
let user_router = express.Router();

user_router.post('/register',user_service.register)
user_router.post('/password/forgot',user_service.forgot_password)
user_router.post('/password/confirm',user_service.confirm_change_password)
user_router.post('/confirm',user_service.confirm)
user_router.post('/login',user_service.login)
user_router.put('/info',authenticated_or_reject,user_service.update_user_info)
user_router.get('/info',authenticated_or_reject,user_service.get_user_info)
user_router.get('/orders',authenticated_or_reject,user_service.get_user_orders)

export {user_router};
