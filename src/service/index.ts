import make_product_service from './product_service'
import {db} from '../database'
let db_connection = db();
let product_service = make_product_service(db_connection)
export {
    product_service
}