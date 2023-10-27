import express from'express'
import {language_admin_service} from '../service'

let language_admin_router = express.Router();

language_admin_router.post('/',language_admin_service.create_language)
language_admin_router.get('/',language_admin_service.get_languages)
language_admin_router.delete('/:id',language_admin_service.delete_language)
language_admin_router.put('/:id',language_admin_service.update_language)

export default language_admin_router;
