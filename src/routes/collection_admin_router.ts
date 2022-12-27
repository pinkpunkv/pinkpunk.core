import express from'express'
import {collection_admin_service} from '../service'
import {req_middleware as m} from '../middleware'

let collection_admin_router = express.Router();

collection_admin_router.get('/:id',m(collection_admin_service.getCollection))
collection_admin_router.get('/',m(collection_admin_service.getCollections))
collection_admin_router.post('/',m(collection_admin_service.createCollection))
collection_admin_router.put('/:id',m(collection_admin_service.updateCollection))
collection_admin_router.delete('/:id',m(collection_admin_service.deleteCollection))

export default collection_admin_router;
