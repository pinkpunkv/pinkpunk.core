import express from'express'
import {category_admin_service} from '../service'
import {req_middleware as m} from '../middleware'

let category_admin_router = express.Router();

category_admin_router.get('/',m(category_admin_service.getCategories))
category_admin_router.post('/',m(category_admin_service.createCategory))
category_admin_router.delete('/:id',m(category_admin_service.deleteCategory))
category_admin_router.put('/:id',m(category_admin_service.updateCategory))

export default category_admin_router;
