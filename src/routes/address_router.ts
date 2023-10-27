import express, { Request,Response } from'express'
import {address_service} from '../service'
let address_router = express.Router();

address_router.get('/',address_service.get_my_addresses)
address_router.post('/',address_service.create_address)
address_router.put('/:addressId',address_service.update_address)
address_router.delete('/:addressId',address_service.delete_address)

export default address_router;
