import express from'express'
import {wish_list_service} from '../service'
import {req_middleware as m} from '../middleware'

let wish_list_router = express.Router();

wish_list_router.get('/',m(wish_list_service.getWish))
wish_list_router.post('/:cartId',m(wish_list_service.addWish))
wish_list_router.delete('/:cartId',m(wish_list_service.removeFromWish))

export default wish_list_router;
