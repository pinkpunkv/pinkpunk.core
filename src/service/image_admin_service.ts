import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import { S3 } from '@aws-sdk/client-s3';

export default function make_image_admin_service(db_connection:PrismaClient,s3client:S3){
    return Object.freeze({
        uploadImages,
        getImages
    });


    async function uploadImages(req:HttpRequest) {
        let images = [];
        return await db_connection.$transaction(async()=>{
            for (let i = 0; i < Object.entries(req.files).length; i++) {
                let file:any = req.files[i];
                let file_path = "/uploads/"+file.originalname
                await s3client.putObject({ Bucket: process.env.S3_BUCKET_NAME, Key: file_path, Body: file.buffer, ACL: 'public-read', ContentType: file.mimetype })
                images.push({url:file_path})
            }
            await db_connection.image.createMany({
                data:images
            })
            return {
                status:StatusCodes.OK,
                message:"success",
                content: null
            }
        })
    }
    async function getImages(req:HttpRequest) {
        let{skip=0,take=20}={...req.query}
        return {
            status:StatusCodes.OK,
            message:"success",
            content: await db_connection.image.findMany({
                orderBy:{id:"desc"},
                skip:Number(skip),
                take:Number(take),
            })
        }
    }

}