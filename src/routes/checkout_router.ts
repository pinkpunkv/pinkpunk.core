import express from'express'
import {checkout_service} from '../service'
let checkout_router = express.Router();

checkout_router.get('/:checkoutId',checkout_service.get_checkout)

checkout_router.post('/preprocess',checkout_service.preprocess_checkout)
checkout_router.post('/:checkoutId',checkout_service.add_to_checkout)
checkout_router.post('/:checkoutId/pay',checkout_service.pay_checkout)
// checkout_router.post('/:checkoutId/place',checkout_service.place_order)
checkout_router.post('/:checkoutId/promo',checkout_service.use_promo)
checkout_router.put('/:orderId/status',checkout_service.update_checkout_status)
checkout_router.put('/:checkoutId',checkout_service.update_checkout)
checkout_router.delete("/decrease/:checkoutId",checkout_service.decrease_from_checkout)
checkout_router.delete('/:checkoutId',checkout_service.remove_variant_from_checkout)

export {checkout_router};
