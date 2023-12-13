import express from'express'
import {post_service} from '../service'
import { wrapp_cache } from '../middleware/cache_middleware';

let post_router = express.Router();

post_router.get('/', wrapp_cache("1 minute"), post_service.get_posts)

export default post_router;
