import express from'express'
import {category_service} from '../service'
let category_router = express.Router();

category_router.get('/',category_service.get_categories)
category_router.get('/main/images',category_service.get_main_categories)
category_router.get('/main/filters',category_service.get_filters_info)

export default category_router;
