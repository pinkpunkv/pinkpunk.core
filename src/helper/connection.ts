
import { S3 } from '@aws-sdk/client-s3';
let conection:S3=null;

export default function connectS3(path: string | null = ''): S3 {
    if (conection==null)
    {
        console.log(process.env.S3_ENDPOINT_URL);
        
        conection = new S3({
            forcePathStyle: true,
            endpoint: `${process.env.S3_ENDPOINT_URL}`,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
            },
        })
    }
    return conection;
}