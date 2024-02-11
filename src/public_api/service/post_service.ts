import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import axios from 'axios';
import format from 'string-template'
import { TokenStorage } from 'src/helper/token_storage';
import { DATA_URL } from 'src/helper/token_storage/const';

export default function make_post_service(db_connection:PrismaClient, token_storage: TokenStorage){
    return Object.freeze({
        get_posts
    });

    async function get_posts(req:Request, res: Response) {
        let posts = await axios.get(format(DATA_URL, {access_token:token_storage.getToken().access_token}))
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: posts.data
        })
    }
}