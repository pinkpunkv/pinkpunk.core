import express from'express'
import {wish_list_service} from '../service'
let wish_list_router = express.Router();

wish_list_router.get('/',wish_list_service.get_wishlist)
wish_list_router.post('/:wishId',wish_list_service.add_to_wishlist)
wish_list_router.delete('/:wishId',wish_list_service.remove_from_wishlist)

export default wish_list_router;
