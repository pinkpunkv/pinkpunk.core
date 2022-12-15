import express, { Request,Response } from'express'
import {product_service} from '../service'
import {req_middleware} from '../middleware'

let product_router = express.Router();

product_router.get('/',req_middleware(product_service.getProducts))

export default product_router;
