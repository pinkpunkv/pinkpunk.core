import express from'express'
import {language_service} from '../service'

let language_router = express.Router();


language_router.get('/',language_service.get_languages)

export default language_router;
