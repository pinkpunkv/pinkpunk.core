import express from'express'
import {main_slider_service} from '../service'
import { cached } from '../middleware/cache';

let main_slider_router = express.Router();


main_slider_router.get('/slider', cached(), main_slider_service.get_setting_with_products)
main_slider_router.get('/admin/slider', main_slider_service.get_setting_with_products)
main_slider_router.post('/admin/slider', main_slider_service.update_settings)

export {main_slider_router};
