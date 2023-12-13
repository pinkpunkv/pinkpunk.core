import express, { Request,Response } from'express'
import {collection_service} from '../service'
import { wrapp_cache } from '../middleware/cache_middleware';

let collection_router = express.Router();

collection_router.get('/:id', wrapp_cache(), collection_service.get_collection)
collection_router.get('/', wrapp_cache(), collection_service.get_collections)

export default collection_router;
