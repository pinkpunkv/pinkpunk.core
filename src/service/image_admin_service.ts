import { PrismaClient } from '@prisma/client'
import { HttpRequest } from "../common";
import {StatusCodes} from 'http-status-codes'
import { S3,ListObjectsV2Command,PutObjectCommand } from '@aws-sdk/client-s3';
import { BaseError } from '../exception';

export default function make_image_admin_service(db_connection:PrismaClient,s3client:S3){
    return Object.freeze({
        uploadImages,
        deleteImage,
        getImages,
        createFolder,
        getFiles,
        deleteFolder
    });

    
    async function uploadImages(req:HttpRequest) {
        let path = req.query['path']

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
           
            return await getFiles(req)
        })
    }

    async function createFolder(req:HttpRequest) {
        let path:string = req.query['path']
        console.log(path);
        
       
        if(path!="/"){
           
            let ind = path.lastIndexOf('/');
            if(ind==-1||ind!=path.length-1)
                path+="/"
        }
        console.log(path);
        await s3client.putObject({ 
            Bucket: process.env.S3_BUCKET_NAME, 
            Key: path, 
            Body: "", 
            ACL: 'public-read' 
        })
        return await getFiles(req)
    }

    async function deleteFolder(req:HttpRequest) {
        let path:string = req.query['path']
        
        if(path!="/"){
           
            let ind = path.lastIndexOf('/');
            if(ind==-1||ind!=path.length-1)
                path+="/"
        }
        await s3client.deleteObject({ 
            Bucket: process.env.S3_BUCKET_NAME, 
            Key: path 
        })
        return await getFiles(req)
    }

    async function deleteImage(req:HttpRequest) {
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
        return await getFiles(req)
    }

    async function getImages(req:HttpRequest) {
        let{skip=0,take=20}={...req.query}
        return {
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
        }
    }
    async function getFiles(req:HttpRequest) {
        let path:string = req.query['path']
        
        let res = await s3client.send(new ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: path
        }))

        let folders = []
        let files = []
        if(path!="/"){
           
            let ind = path.lastIndexOf('/');
            if(ind==-1||ind!=path.length-1)
                path+="/"
        }
        if(res.Contents){
            for (let obj of res.Contents.filter(x=>x.Key!=path)) {
                let ind = obj.Key.indexOf(path)
               
                if((ind==-1&&path=="/")||(ind!=-1&&path.length>1)){
                    let objName = obj.Key.slice(path.length>1?path.length:path.length-1,obj.Key.length);
                    let slashInd = objName.indexOf("/");
                   
                    if(!obj.Key.includes(".")||slashInd!=-1){
                        let folderName = objName.slice(0,slashInd);
                        if(folderName.length>0&&folders.filter(x=>x.name==folderName).length==0)
                            folders.push({
                                name:folderName,
                                url:obj.Key.slice(0,folderName.length+1)
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
                    let folderName = obj.Key.slice(0,ind);
                   
                    if(folderName.length>0&&folders.filter(x=>x.name==folderName).length==0)
                        folders.push({
                            name:folderName,
                            url:obj.Key.slice(0,folderName.length+1)
                        })
                }
            }
        }
        
        return {
            status:StatusCodes.OK,
            message:"success",
            content: {
                files:files,
                folders:folders
            }
        }
    }

}