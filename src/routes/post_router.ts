import express from'express'
import {post_service} from '../service'

let post_router = express.Router();

post_router.get('/',post_service.get_posts)

export default post_router;
