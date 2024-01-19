import express from'express'
import {main_slider_service} from '../service'
import { wrapp_cache } from '../middleware/cache_middleware';

let main_slider_router = express.Router();


main_slider_router.get('/slider', wrapp_cache(), main_slider_service.get_setting_with_products)
main_slider_router.get('/admin/slider', main_slider_service.get_setting_with_products)
main_slider_router.post('/admin/slider', main_slider_service.update_settings)

export default main_slider_router;
