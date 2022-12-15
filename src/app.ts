import express,{Express} from "express";
import {config} from './config'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import {product_router} from './routes'

let app:Express = express();

app.use(logger('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/product',product_router)

app.listen(config.PORT,()=>{
    console.log(`app listening on port ${config.PORT}`)
})