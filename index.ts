import cors from "cors"
import express from "express"
import { authMiddleware } from "./middleware/authMiddleware"
import { applicationRouter } from "./routes/application"
import { router as authRouter } from "./routes/authentication"
import { companyRouter } from "./routes/company"
import { companySettingsRouter } from "./routes/companySettings"
import { companyTypeRouter } from "./routes/companytype"
import { jobRouter } from "./routes/jobRouter"
import { jobtyperouter } from "./routes/jobstype"
import { roleRouter } from "./routes/role"
import { userRouter } from "./routes/user"
import { userDetailsRouter } from "./routes/userDetails"
import { isAdmin } from "./middleware/rolesMiddleware"
import { errorRouter } from "./routes/error"
import { initializeWebSocket } from "./websocket"

const app=express()
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ limit: '500mb', extended: true }))

app.use(cors({
    origin: ['interviewer-frontend-lm5m.vercel.app','http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:true
}))

app.use("/api/v1/users",userRouter)
app.use('/api/v1/auth',authRouter) 
app.use('/api/v1/userdetails',authMiddleware,userDetailsRouter) 
app.use('/api/v1/roles',roleRouter)
app.use('/api/v1/jobtype',authMiddleware,isAdmin,jobtyperouter) 
app.use('/api/v1/companytype',authMiddleware ,isAdmin,companyTypeRouter) 
app.use('/api/v1/companysettings',authMiddleware,isAdmin,companySettingsRouter)
app.use('/api/v1/company',authMiddleware,companyRouter) 
app.use('/api/v1/job',authMiddleware,jobRouter)
app.use('/api/v1/application',authMiddleware,applicationRouter)
app.use('/api/v1/error',errorRouter)

export const httpserver=app.listen(2000, () => {
    console.log('Server running on port 2000')
    // Initialize WebSocket server after HTTP server is created
    initializeWebSocket(httpserver)
});

