import express, { Request,Response } from'express'
import {collection_service} from '../service'

let collection_router = express.Router();

collection_router.get('/:id',collection_service.get_collection)
collection_router.get('/',collection_service.get_collections)

export default collection_router;
