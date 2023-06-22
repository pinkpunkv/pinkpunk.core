import multer from 'multer'

import express, { Request } from'express'
import {color_admin_service} from '../service'
import {req_middleware as m} from '../middleware'
let color_admin_router = express.Router();
let uploads = multer({})

color_admin_router.post('/',m(color_admin_service.createColor))
color_admin_router.get("/",m(color_admin_service.getAllColors))
color_admin_router.put('/:colorId',m(color_admin_service.updateColorInfo))
color_admin_router.delete('/:colorId',m(color_admin_service.deleteColor))

export default color_admin_router;
