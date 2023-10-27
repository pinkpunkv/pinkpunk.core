import express from'express'
import {variant_admin_service} from '../service'

let variant_admin_router = express.Router();

variant_admin_router.get('/:id',variant_admin_service.get_variant_products)
variant_admin_router.post('/',variant_admin_service.add_product_variants)
variant_admin_router.get('/template',variant_admin_service.create_variant_template)
variant_admin_router.post('/template',variant_admin_service.get_variants_template)
variant_admin_router.delete('/template',variant_admin_service.detele_variants_templates)

export default variant_admin_router;
