import express from'express'
import {language_service} from '../service'

let post_router = express.Router();


post_router.get('/',language_service.get_languages)

export default post_router;
