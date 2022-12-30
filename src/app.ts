import express,{Express} from "express";
import {config} from './config'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import {product_router,product_admin_router,category_admin_router,category_router,
    variant_admin_router,collection_admin_router,collection_router,image_admin_router,
    language_admin_router,language_router,tag_admin_router,tag_router} from './routes'


let app:Express = express();
app.use(express.json());
app.use(morgan('combined'))
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/product', product_router)
app.use('/api/v1/admin/product', product_admin_router)

app.use('/api/v1/category', category_router)
app.use('/api/v1/admin/category', category_admin_router)

app.use('/api/v1/admin/variant', variant_admin_router)

app.use('/api/v1/collection', collection_router)
app.use('/api/v1/admin/collection', collection_admin_router)

app.use("/api/v1/admin/image",image_admin_router)

app.use('/api/v1/language', language_router)
app.use('/api/v1/admin/language', language_admin_router)

app.use('/api/v1/tag', tag_router)
app.use('/api/v1/admin/tag', tag_admin_router)

app.listen(config.PORT,()=>{
    console.log(`app listening on port ${config.PORT}`)
})