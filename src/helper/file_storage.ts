
import { S3 } from '@aws-sdk/client-s3';
import {config} from '../config'

export function file_storage(path: string | null = ''): S3 {
    return new S3({
        forcePathStyle: true,
        endpoint: `${config.S3_ENDPOINT_URL}`,
        region:'us-east-1',
        credentials: {
            accessKeyId: config.S3_ACCESS_KEY!,
            secretAccessKey: config.S3_SECRET_KEY!,
        },
    });
}