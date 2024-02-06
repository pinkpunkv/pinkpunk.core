import { S3 } from '@aws-sdk/client-s3';
import { S3_ACCESS_KEY, S3_DSN, S3_SECRET_KEY } from './env';

export function file_storage(): S3 {
    return new S3({
        forcePathStyle: true,
        endpoint: S3_DSN,
        region:'us-east-1',
        credentials: {
            accessKeyId: S3_ACCESS_KEY,
            secretAccessKey: S3_SECRET_KEY,
        },
    });
}