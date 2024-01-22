import express from'express'
import {cart_service} from '../service'

let cart_router = express.Router();

cart_router.get('/', cart_service.get_cart)
cart_router.post('/:cart_id',cart_service.add_to_cart)
cart_router.delete("/decrease/:cart_id",cart_service.decrease_from_cart)
cart_router.delete('/:cart_id',cart_service.remove_from_cart)

export {cart_router};
