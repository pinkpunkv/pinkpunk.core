import express from'express'
import {checkout_admin_service} from '../service'

let checkout_admin_router = express.Router();

checkout_admin_router.get('/orders',checkout_admin_service.get_user_checkouts)
checkout_admin_router.get('/:checkoutId',checkout_admin_service.get_checkout_info)
checkout_admin_router.post('/',checkout_admin_service.create_checkout)
checkout_admin_router.get('/',checkout_admin_service.get_checkouts)
checkout_admin_router.put('/:checkoutId',checkout_admin_service.update_checkout)
checkout_admin_router.post('/:checkoutId',checkout_admin_service.add_to_checkout)
checkout_admin_router.delete("/decrease/:checkoutId",checkout_admin_service.decrease_from_checkout)
checkout_admin_router.delete('/:checkoutId',checkout_admin_service.remove_variant_from_checkout)

export default checkout_admin_router;
