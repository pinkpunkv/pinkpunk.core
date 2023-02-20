import express, { Request,Response } from'express'
import {product_service} from '../service'
import {req_middleware} from '../middleware'

let product_router = express.Router();

product_router.get('/',req_middleware(product_service.getProducts))
product_router.get('/path',req_middleware(product_service.getProductsPathes))
product_router.get('/path/:path',req_middleware(product_service.getProductByPath))
product_router.get('/filters',req_middleware(product_service.getFilters))

product_router.get('/search',req_middleware(product_service.searchProducts))
product_router.get('/:id',req_middleware(product_service.getProduct))

export default product_router;
