import express from'express'
import {product_service} from '../service'
import { cached } from '../middleware/cache';
let product_router = express.Router();

product_router.get('/', cached(), product_service.get_products)
product_router.get('/popular_new', cached(), product_service.get_popular_and_new_products)
product_router.get('/path', cached(), product_service.get_products_pathes)
product_router.get('/:slug', cached(), product_service.get_product_by_slug)
product_router.get('/filters', cached(), product_service.get_filters)

product_router.get('/search', product_service.search_products)
product_router.get('/:id/info', cached(), product_service.get_product)
product_router.post('/:id/want', product_service.want_to)

export {product_router};
