import express from'express'
import {category_service} from '../service'
import {req_middleware as m} from '../middleware'

let category_router = express.Router();

category_router.get('/',m(category_service.getCategories))
category_router.get('/main/images',m(category_service.getMainCategoriesWithProductImages))

export default category_router;
