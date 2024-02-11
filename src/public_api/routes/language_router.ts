import express from'express'
import {language_service} from '../service'
import { cached } from '../middleware/cache';

let language_router = express.Router();


language_router.get('/', cached(), language_service.get_languages)

export {language_router};
