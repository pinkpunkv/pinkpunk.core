import express, { Request } from'express'
import {size_admin_service} from '../service'
let size_admin_router = express.Router();

size_admin_router.get("/",size_admin_service.get_all_sizes)

export default size_admin_router;
