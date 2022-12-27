import express from'express'
import {variant_admin_service} from '../service'
import {req_middleware as m} from '../middleware'

let variant_admin_router = express.Router();

variant_admin_router.get('/:id',m(variant_admin_service.getVariantProducts))
variant_admin_router.post('/',m(variant_admin_service.addProductVariants))
variant_admin_router.get('/template',m(variant_admin_service.createVariantTemplate))
variant_admin_router.post('/template',m(variant_admin_service.getVariantsTemplates))
variant_admin_router.delete('/template',m(variant_admin_service.deteleVariantsTemplates))

export default variant_admin_router;
