import express from'express'
import {tag_service} from '../service'
import { cached } from '../middleware/cache';
let tag_router = express.Router();

tag_router.get('/', cached(), tag_service.get_tags_with_products)

export {tag_router};
