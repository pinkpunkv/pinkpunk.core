
import dotenv from 'dotenv'
dotenv.config()
let config = {
    PORT:process.env.PORT?process.env.PORT:3211,
    DATABASE_URL:process.env.DATABASE_URL,
    accessTokenPrivateKey:process.env.accessTokenPrivateKey,
    refreshTokenPrivateKey:process.env.refreshTokenPrivateKey,
    S3_ACCESS_KEY:process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY:process.env.S3_SECRET_KEY,
    S3_ENDPOINT_URL:process.env.S3_ENDPOINT_URL,
    S3_BUCKET_NAME:process.env.S3_BUCKET_NAME,
    SECRET:process.env.SECRET,
    accessTokenExpiresIn:90,
    refreshTokenExpiresIn:180
}
export {
    config
} 