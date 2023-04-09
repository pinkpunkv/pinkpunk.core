import multer from 'multer'

import express, { Request } from'express'
import {image_admin_service} from '../service'
import {req_middleware as m} from '../middleware'
let image_admin_router = express.Router();
let uploads = multer({})

image_admin_router.post('/',uploads.array("files"),m(image_admin_service.uploadImages))
image_admin_router.post('/folder',m(image_admin_service.createFolder))
image_admin_router.get("/",m(image_admin_service.getFiles))
image_admin_router.delete('/',m(image_admin_service.deleteImage))
image_admin_router.delete('/folder',m(image_admin_service.deleteFolder))

export default image_admin_router;
