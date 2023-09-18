import express from "express"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import cors from "cors"
import cron from "node-cron"

const originURL = process.env.ORIGIN_URL || process.env.OPENSHIFT_NODEJS_ORIGIN_URL || "https://localhost:8000"

const corsOptions = {
    origin: originURL,
    credentials: true,
    optionsSuccessStatus: 200
}

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(helmet())
console.log(`===== SERVER RUNNING ON PORT ${originURL} =====`)
