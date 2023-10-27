import express from'express'
import {user_admin_service} from '../service'
let user_admin_router = express.Router();

user_admin_router.get('/',user_admin_service.get_users)
user_admin_router.get('/:userId',user_admin_service.get_user_info)
user_admin_router.put('/:userId',user_admin_service.update_user_info)
user_admin_router.put('/:userId/status',user_admin_service.update_user_status)


export default user_admin_router;
