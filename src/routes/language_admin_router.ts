import express from'express'
import {language_admin_service} from '../service'
import {req_middleware as m} from '../middleware'

let language_admin_router = express.Router();

language_admin_router.post('/',m(language_admin_service.createLanguage))
language_admin_router.get('/',m(language_admin_service.getLanguages))
language_admin_router.delete('/:id',m(language_admin_service.deleteLanguage))
language_admin_router.put('/:id',m(language_admin_service.updateLanguage))

export default language_admin_router;
