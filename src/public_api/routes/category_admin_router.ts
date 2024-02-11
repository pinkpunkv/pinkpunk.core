import express from'express'
import {category_admin_service} from '../service'

let category_admin_router = express.Router();

category_admin_router.get('/',category_admin_service.get_categories)
category_admin_router.post('/',category_admin_service.create_category)
category_admin_router.delete('/:id',category_admin_service.delete_category)
category_admin_router.put('/:id',category_admin_service.update_category)

export {category_admin_router};
