import express, { Request } from'express'
import {promo_admin_service} from '../service'
let promo_admin_router = express.Router();

promo_admin_router.get("/",promo_admin_service.get_all)
promo_admin_router.post("/",promo_admin_service.create)
promo_admin_router.get("/:code",promo_admin_service.get)
promo_admin_router.put("/:code",promo_admin_service.update)
promo_admin_router.delete("/:code",promo_admin_service.remove)

export {promo_admin_router};
