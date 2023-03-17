import express from'express'
import {checkout_service} from '../service'
import {req_middleware as m} from '../middleware'

let checkout_router = express.Router();

checkout_router.get('/:checkoutId',m(checkout_service.getCheckout))
checkout_router.post('/preprocess',m(checkout_service.preprocessCheckout))
checkout_router.post('/:checkoutId',m(checkout_service.addToCheckout))
checkout_router.put('/:checkoutId',m(checkout_service.updateCheckout))
checkout_router.delete("/:checkoutId/decrease",m(checkout_service.decreaseCountFromCheckout))
checkout_router.delete('/:checkoutId',m(checkout_service.removeVariantFromCheckout))

export default checkout_router;
