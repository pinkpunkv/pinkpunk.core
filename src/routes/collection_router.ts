import express, { Request,Response } from'express'
import {collection_service} from '../service'
import {req_middleware} from '../middleware'

let collection_router = express.Router();

collection_router.get('/:id',req_middleware(collection_service.getCollection))
collection_router.get('/',req_middleware(collection_service.getCollections))

export default collection_router;
