import express from'express'
import {cart_service} from '../service'

let cart_router = express.Router();

cart_router.get('/',cart_service.get_cart)
cart_router.post('/:cartId',cart_service.add_to_cart)
cart_router.delete("/decrease/:cartId",cart_service.decrease_from_cart)
cart_router.delete('/:cartId',cart_service.remove_from_cart)

export default cart_router;
