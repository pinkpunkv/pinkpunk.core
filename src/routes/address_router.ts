import express, { Request,Response } from'express'
import {address_service} from '../service'
import {req_middleware} from '../middleware'

let address_router = express.Router();

address_router.get('/',req_middleware(address_service.getMyAddresses))
address_router.post('/',req_middleware(address_service.createAddress))
address_router.put('/:addressId',req_middleware(address_service.updateAddress))
address_router.delete('/:addressId',req_middleware(address_service.deleteAddress))

export default address_router;
