import { ENV } from "@abstract/env"

const S3_ACCESS_KEY=ENV.get("S3_ACCESS_KEY")
const S3_SECRET_KEY=ENV.get("S3_SECRET_KEY")
const S3_DSN=ENV.get("S3_DSN")
const S3_BUCKET_NAME=ENV.get("S3_BUCKET_NAME")

export {S3_ACCESS_KEY, S3_BUCKET_NAME, S3_DSN, S3_SECRET_KEY}