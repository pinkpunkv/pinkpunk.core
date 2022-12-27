import express from'express'
import {language_service} from '../service'
import {req_middleware as m} from '../middleware'

let language_router = express.Router();


language_router.get('/',m(language_service.getLanguages))

export default language_router;
