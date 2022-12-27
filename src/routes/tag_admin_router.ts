import express from'express'
import {tag_admin_service} from '../service'
import {req_middleware as m} from '../middleware'

let tag_admin_router = express.Router();

tag_admin_router.post('/',m(tag_admin_service.createTag))
tag_admin_router.get('/',m(tag_admin_service.getTags))
tag_admin_router.delete('/:tag',m(tag_admin_service.deleteTag))

export default tag_admin_router;
