import { ENV } from "@abstract/env"

const PUBLIC_API_PORT=ENV.get("PUBLIC_API_PORT")
const DATABASE_URL=ENV.get("DATABASE_URL")
const SECRET=ENV.get("SECRET")

export {PUBLIC_API_PORT, DATABASE_URL, SECRET}