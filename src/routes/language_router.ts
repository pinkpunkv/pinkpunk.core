import express from'express'
import {language_service} from '../service'
import { wrapp_cache } from '../middleware/cache_middleware';

let language_router = express.Router();


language_router.get('/', wrapp_cache(), language_service.get_languages)

export default language_router;
