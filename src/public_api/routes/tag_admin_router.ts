import express from'express'
import {tag_admin_service} from '../service'

let tag_admin_router = express.Router();

tag_admin_router.post('/',tag_admin_service.create_tag)
tag_admin_router.get('/',tag_admin_service.get_tags)
tag_admin_router.delete('/:tag',tag_admin_service.delete_tag)

export {tag_admin_router};
