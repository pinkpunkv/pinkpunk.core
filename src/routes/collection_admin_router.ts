import express from'express'
import {collection_admin_service} from '../service'
let collection_admin_router = express.Router();

collection_admin_router.get('/:id',collection_admin_service.get_collection)
collection_admin_router.get('/',collection_admin_service.get_collections)
collection_admin_router.post('/',collection_admin_service.create_collection)
collection_admin_router.put('/:id',collection_admin_service.update_collection)
collection_admin_router.delete('/:id',collection_admin_service.delete_collection)

export {collection_admin_router};
