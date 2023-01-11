import express from'express'
import {cart_service} from '../service'
import {req_middleware as m} from '../middleware'

let cart_router = express.Router();

cart_router.get('/',m(cart_service.getCart))
cart_router.post('/:cartId',m(cart_service.addToCart))
cart_router.delete('/:cartId',m(cart_service.removeFromCart))

export default cart_router;
