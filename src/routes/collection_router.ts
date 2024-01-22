import express, { Request,Response } from'express'
import {collection_service} from '../service'
import { cached } from '../middleware/cache';

let collection_router = express.Router();

collection_router.get('/:id', cached(), collection_service.get_collection)
collection_router.get('/', cached(), collection_service.get_collections)

export {collection_router};
