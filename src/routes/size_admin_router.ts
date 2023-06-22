import express, { Request } from'express'
import {size_admin_service} from '../service'
import {req_middleware as m} from '../middleware'
let size_admin_router = express.Router();

size_admin_router.get("/",m(size_admin_service.getAllSizes))

export default size_admin_router;
