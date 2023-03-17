import make_product_service from './product_service'
import make_admin_product_service from './product_admin_service';

import make_collection_service from './collection_service';
import make_collection_admin_service from './collection_admin_service';

import make_admin_variant_service from './variant_admin_service';

import make_category_service from './categories_service';
import make_admin_category_service from './categories_admin_service';

import make_image_admin_service from './image_admin_service';

import make_tag_admin_service from './tag_admin_service';
import make_tag_service from './tag_service';

import make_language_admin_service from './language_admin_service';
import make_language_service from './language_service';

import make_user_service from './user_service';

import make_cart_service from './cart_service';
import make_wish_list_service from './wish_list_service'

import make_address_service from './address_service'

import make_checkout_service from './checkout_service'


import {db} from '../database'
import {connectS3} from '../helper'

let db_connection = db();
let s3storage = connectS3(process.env.storage);

const address_service = make_address_service(db_connection)
const tag_service = make_tag_service(db_connection)
const tag_admin_service = make_tag_admin_service(db_connection)
const product_service = make_product_service(db_connection)
const collection_service = make_collection_service(db_connection)
const product_admin_service = make_admin_product_service(db_connection)
const variant_admin_service = make_admin_variant_service(db_connection)
const collection_admin_service = make_collection_admin_service(db_connection)
const category_service = make_category_service(db_connection)
const category_admin_service = make_admin_category_service(db_connection)
const image_admin_service = make_image_admin_service(db_connection,s3storage)
const language_service = make_language_service(db_connection)
const language_admin_service = make_language_admin_service(db_connection)
const user_service = make_user_service(db_connection)
const cart_service = make_cart_service(db_connection)
const wish_list_service = make_wish_list_service(db_connection)
const checkout_service = make_checkout_service(db_connection)
export {
    address_service,
    product_service,
    collection_service,
    product_admin_service,
    variant_admin_service,
    collection_admin_service,
    category_service,
    category_admin_service,
    image_admin_service,
    tag_admin_service,
    tag_service,
    language_service,
    language_admin_service,
    user_service,
    cart_service,
    wish_list_service,
    checkout_service
}