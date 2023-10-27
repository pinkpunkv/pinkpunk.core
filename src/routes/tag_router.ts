import express from'express'
import {tag_service} from '../service'
let tag_router = express.Router();

tag_router.get('/',tag_service.get_tags_with_products)

export default tag_router;
