import express, { Request,Response } from'express'
import {product_admin_service} from '../service'
import {auth_middleware as am} from '../middleware'

let product_admin_router = express.Router();

product_admin_router.get('/',product_admin_service.get_products)
product_admin_router.get('/:id',product_admin_service.get_product)
product_admin_router.post("/",product_admin_service.create_product)
product_admin_router.put("/:id",product_admin_service.update_product)
product_admin_router.delete("/:id",product_admin_service.delete_product)

export default product_admin_router;
