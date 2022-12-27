import express from'express'
import {tag_service} from '../service'
import {req_middleware as m} from '../middleware'

let tag_router = express.Router();

tag_router.get('/',m(tag_service.getTagsWithProducts))

export default tag_router;
