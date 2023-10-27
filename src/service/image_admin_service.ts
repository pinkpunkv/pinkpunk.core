import { PrismaClient } from '@prisma/client'
import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import { S3,ListObjectsV2Command,PutObjectCommand } from '@aws-sdk/client-s3';
import { BaseError } from '../exception';
import * as ef from 'express-fileupload';
const imageRegex= /[\/.](gif|jpg|jpeg|tiff|png)$/i;
export default function make_image_admin_service(db_connection:PrismaClient,s3client:S3){
    return Object.freeze({
        upload_images,
        delete_images,
        get_images,
        create_folder,
        get_files,
        delete_folder
    });

    
    async function upload_images(req:Request, res: Response) {
        let path:string = req.query.path!.toString()
        path = pathFilter(path);
        return await db_connection.$transaction(async()=>{
            if (req.files==null)
                throw new BaseError(417,"files is null",[]);
            
            for (let i = 0; i < Object.entries(req.files).length; i++) {
                let file:any = req.files[i];
                let file_path = path+file.originalname
                let res = await s3client.putObject({ 
                    Bucket: process.env.S3_BUCKET_NAME, 
                    Key: file_path, 
                    Body: file.buffer, 
                    ACL: 'public-read', 
                    ContentType: file.mimetype 
                })
                await db_connection.image.create({
                    data:{
                        url:"/"+file_path
                    }
                })
            }
           
            return await get_files(req,res)
        })
    }
    function pathFilter(path:string){
        if(path!="/"){
            if(path.startsWith("/"))
                path = path.slice(1,path.length)
            if(!path.endsWith('/'))
                path+="/"
        }
        return path;
    }
    async function create_folder(req:Request, res: Response) {
        let path:string = req.query.path!.toString()
        path = pathFilter(path);
        await s3client.putObject({ 
            Bucket: process.env.S3_BUCKET_NAME, 
            Key: path, 
            Body: "", 
            ACL: 'public-read' 
        })
        return await get_files(req,res)
    }

    async function delete_folder(req:Request, res: Response) {
        let path:string = req.query.path!.toString()
        
        path = pathFilter(path);
        await s3client.deleteObject({ 
            Bucket: process.env.S3_BUCKET_NAME, 
            Key: path 
        })
        return await get_files(req,res)
    }

    async function delete_images(req:Request, res: Response) {
        let imageId = req.query['imageId']
        await db_connection.$transaction(async()=>{
            let image = await db_connection.image.delete({
                where:{
                    id:Number(imageId)
                }
            })
            await s3client.deleteObject({Bucket: process.env.S3_BUCKET_NAME, Key: image.url})
            let ind = image.url.lastIndexOf('/')
            if(ind==-1)
                req.query['path']="/"
            else
                req.query['path']=image.url.slice(0,ind)
            return image;
        });
        return await get_files(req,res)
    }

    async function get_images(req:Request, res: Response) {
        let{skip=0,take=20}={...req.query}
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: {
                images:await db_connection.image.findMany({
                    orderBy:{id:"desc"},
                    skip:Number(skip),
                    take:Number(take),
                }),
                total: (await db_connection.image.aggregate({
                    _count:true
                }))._count
            }
        })
    }
    
    async function get_files(req:Request, res: Response) {
        let path:string = String(req.query.path)
        
        let result = await s3client.send(new ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: path
        }))
        
        let folders = []
        let files = []
        path = pathFilter(path);

        if(result.Contents){
            // for ( let obj of res.Contents){
            //     if(imageRegex.test(obj.Key)){
            //         let file = await db_connection.image.create({
            //             data:{
            //                 url:"/"+obj.Key
            //             }
            //         })
            //     }
            // }
                
            for (let obj of result.Contents.filter(x=>x.Key!=path)) {
                let ind = obj.Key!.indexOf(path)
                if((ind==-1&&path=="/")||(ind!=-1&&path.length>1)){
                    let objName = obj.Key!.slice(path.length>1?path.length:path.length-1,obj.Key!.length);
                    let slashInd = objName.indexOf("/");
                    
                    if(!imageRegex.test(obj.Key!)||slashInd!=-1){
                        let folderName = objName.slice(0,slashInd);
                        if(folderName.length>0&&folders.filter(x=>x.name==folderName).length==0)
                        folders.push({
                            name:folderName,
                            url:path+folderName+"/"
                        })
                    }
                    else{
                        let file = await db_connection.image.findFirst({
                            where:{
                                url:"/"+obj.Key
                            }
                        })
                        if(file!=null)
                        files.push({name:objName,...file})
                    }
                }
                else{
                    let folderName = obj.Key!.slice(0,ind);
                    
                    if(folderName.length>0&&folders.filter(x=>x.name==folderName).length==0)
                        folders.push({
                            name:folderName,
                            url:path+folderName+"/"
                        })
                }
            }
        }
        
        return res.status(StatusCodes.OK).send({
            status:StatusCodes.OK,
            message:"success",
            content: {
                files:files,
                folders:folders
            }
        })
    }

}