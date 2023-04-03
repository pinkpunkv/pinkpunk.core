import express from'express'
import {checkout_admin_service} from '../service'
import {req_middleware as m} from '../middleware'

let checkout_admin_router = express.Router();

checkout_admin_router.get('/:checkoutId',m(checkout_admin_service.getCheckoutInfo))
checkout_admin_router.get('/',m(checkout_admin_service.getCheckouts))
checkout_admin_router.put('/:checkoutId',m(checkout_admin_service.updateCheckout))
checkout_admin_router.post('/:checkoutId',m(checkout_admin_service.addToCheckout))
checkout_admin_router.delete("/decrease/:checkoutId",m(checkout_admin_service.decreaseCountFromCheckout))
checkout_admin_router.delete('/:checkoutId',m(checkout_admin_service.removeVariantFromCheckout))

export default checkout_admin_router;
