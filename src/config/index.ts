
import dotenv from 'dotenv'
dotenv.config()
let config = {
    PORT:process.env.PORT?process.env.PORT:3211,
    DATABASE_URL:process.env.DATABASE_URL
}
export {
    config
} 