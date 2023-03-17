import express, { Request,Response } from'express'
import {product_admin_service} from '../service'
import {req_middleware as m,auth_middleware as am} from '../middleware'

let product_admin_router = express.Router();

product_admin_router.get('/',m(product_admin_service.getProducts))
product_admin_router.get('/:id',m(product_admin_service.getProduct))
product_admin_router.post("/",m(product_admin_service.createProduct))
product_admin_router.put("/:id",m(product_admin_service.updateProduct))
product_admin_router.delete("/:id",m(product_admin_service.deleteProduct))

export default product_admin_router;
