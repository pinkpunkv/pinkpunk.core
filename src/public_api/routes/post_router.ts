import express from'express'
import {post_service} from '../service'
import { cached } from '../middleware/cache';

let post_router = express.Router();

post_router.get('/', cached("1 minute"), post_service.get_posts)

export {post_router};
