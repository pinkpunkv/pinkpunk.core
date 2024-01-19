import express from'express'
import {product_service} from '../service'
import { wrapp_cache } from '../middleware/cache_middleware';
let product_router = express.Router();

product_router.get('/', wrapp_cache(), product_service.get_products)
product_router.get('/popular_new', wrapp_cache(), product_service.get_popular_and_new_products)
product_router.get('/path', wrapp_cache(), product_service.get_products_pathes)
product_router.get('/path/:path', wrapp_cache(), product_service.get_product_by_path)
product_router.get('/filters', wrapp_cache(), product_service.get_filters)

product_router.get('/search', product_service.search_products)
product_router.get('/:id', wrapp_cache(), product_service.get_product)
product_router.post('/:id/want', product_service.want_to)

export default product_router;
