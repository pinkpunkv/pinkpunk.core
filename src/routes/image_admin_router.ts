import multer from 'multer'

import express, { Request } from'express'
import {image_admin_service} from '../service'
let image_admin_router = express.Router();
let uploads = multer({})

image_admin_router.post('/',uploads.array("files"),image_admin_service.upload_images)
image_admin_router.post('/folder',image_admin_service.create_folder)
image_admin_router.get("/",image_admin_service.get_files)
image_admin_router.delete('/',image_admin_service.delete_images)
image_admin_router.delete('/folder',image_admin_service.delete_folder)

export default image_admin_router;
