import express from'express'
import {user_admin_service} from '../service'
import {req_middleware as m} from '../middleware'
let user_admin_router = express.Router();

user_admin_router.get('/',m(user_admin_service.getAllUsers))
user_admin_router.get('/:userId',m(user_admin_service.getUserInfo))
user_admin_router.put('/:userId',m(user_admin_service.updateUserInfo))
user_admin_router.put('/:userId/status',m(user_admin_service.updateUserStatus))


export default user_admin_router;
