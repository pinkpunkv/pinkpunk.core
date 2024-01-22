import { DeliveryType } from "@prisma/client";
import {pickup_order_validator} from './pickup'
import {courier_order_validator} from './courier'
import {parcel_order_validator} from './parcel'

const order_delivery_type_validator = {
    [DeliveryType.pickup]: pickup_order_validator,
    [DeliveryType.parcel]: parcel_order_validator,
    [DeliveryType.courier]: courier_order_validator
}

export {order_delivery_type_validator}

export * from './parcel'
export * from './pickup'
export * from './courier'