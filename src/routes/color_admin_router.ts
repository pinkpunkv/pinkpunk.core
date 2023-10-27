import multer from 'multer'

import express, { Request } from'express'
import {color_admin_service} from '../service'
let color_admin_router = express.Router();

color_admin_router.post('/',color_admin_service.create_color)
color_admin_router.get("/",color_admin_service.get_colors)
color_admin_router.put('/:colorId',color_admin_service.update_color)
color_admin_router.delete('/:colorId',color_admin_service.delete_color)

export default color_admin_router;
