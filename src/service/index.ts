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
import make_user_admin_service from './user_admin_service';

import make_cart_service from './cart_service';
import make_wish_list_service from './wish_list_service'

import make_address_service from './address_service'

import make_checkout_service from './checkout_service'
import make_admin_checkout_service from './checkout_admin_service';

import make_color_admin_service from './color_admin_service'
import make_size_admin_service from './size_admin_service'
import make_post_service from './post_service'
import {db} from '../database'
import {file_storage} from '../helper'
import { token_storage } from '../token_storage';
import make_main_slider_service from './main_slider'
import path from 'path'

let db_connection = db();
let s3storage = file_storage(process.env.storage);
let t_storage = token_storage()

db_connection.$use(async (params, next) => {
    if (params.model == 'Variant'||params.model=="Product") {
      if (params.action == 'delete') {
        params.action = 'update'
        params.args['data'] = { deleted: true }
      }
      if (params.action == 'deleteMany') {
        params.action = 'updateMany'
        if (params.args.data != undefined) {
          params.args.data['deleted'] = true
        } else {
          params.args['data'] = { deleted: true }
        }
      }
    }
    return next(params)
  })

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
const user_admin_service = make_user_admin_service(db_connection)
const cart_service = make_cart_service(db_connection)
const wish_list_service = make_wish_list_service(db_connection)
const checkout_service = make_checkout_service(db_connection)
const checkout_admin_service = make_admin_checkout_service(db_connection)
const color_admin_service = make_color_admin_service(db_connection)
const size_admin_service = make_size_admin_service(db_connection)
const post_service = make_post_service(db_connection, t_storage)
const main_slider_service = make_main_slider_service(db_connection)

export {
  tag_service,
  post_service,
  user_service,
  cart_service,
  address_service,
  product_service,
  language_service,
  checkout_service,
  category_service,
  tag_admin_service,
  wish_list_service,
  user_admin_service,
  collection_service,
  size_admin_service,
  color_admin_service,
  main_slider_service,
  image_admin_service,
  product_admin_service,
  variant_admin_service,
  category_admin_service,
  language_admin_service,
  checkout_admin_service,
  collection_admin_service,
}