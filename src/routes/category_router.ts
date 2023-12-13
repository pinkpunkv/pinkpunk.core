import express from'express'
import {category_service} from '../service'
import { wrapp_cache } from '../middleware/cache_middleware';
let category_router = express.Router();

category_router.get('/', wrapp_cache(), category_service.get_categories)
category_router.get('/main/images', wrapp_cache("30 seconds"), category_service.get_main_categories)
category_router.get('/main/filters', wrapp_cache("30 seconds"), category_service.get_filters_info)

export default category_router;
