import express from'express'
import {category_service} from '../service'
import { cached } from '../middleware/cache';
let category_router = express.Router();

category_router.get('/', cached(), category_service.get_categories)
category_router.get('/main/images', cached("30 seconds"), category_service.get_main_categories)
category_router.get('/main/filters', cached("30 seconds"), category_service.get_filters_info)

export {category_router};
