
import { S3 } from '@aws-sdk/client-s3';
import {config} from '../config'
let conection:S3=null;

export default function connectS3(path: string | null = ''): S3 {
    if (conection==null)
    {
        console.log(config.S3_ENDPOINT_URL);
        
        conection = new S3({
            forcePathStyle: true,
            endpoint: `${config.S3_ENDPOINT_URL}`,
            credentials: {
                accessKeyId: config.S3_ACCESS_KEY,
                secretAccessKey: config.S3_SECRET_KEY,
            },
        })
    }
    return conection;
}