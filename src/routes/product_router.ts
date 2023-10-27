import express, { Request,Response } from'express'
import {product_service} from '../service'
let product_router = express.Router();

product_router.get('/',product_service.get_products)
product_router.get('/path',product_service.get_products_pathes)
product_router.get('/path/:path',product_service.get_product_by_path)
product_router.get('/filters',product_service.get_filters)

product_router.get('/search',product_service.search_products)
product_router.get('/:id',product_service.get_product)
product_router.post('/:id/want',product_service.want_to)

export default product_router;
