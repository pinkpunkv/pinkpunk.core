import express from'express'
import {tag_service} from '../service'
import { wrapp_cache } from '../middleware/cache_middleware';
let tag_router = express.Router();

tag_router.get('/', wrapp_cache(), tag_service.get_tags_with_products)

export default tag_router;
