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
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ limit: '500mb', extended: true }))

app.use(cors({
    origin: ['interviewer-frontend-lm5m.vercel.app','http://localhost:3000','http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:true
}))

app.use("/api/v1/users",userRouter)
app.use('/api/v1/auth',authRouter) 
app.use('/api/v1/userdetails',authMiddleware,userDetailsRouter) 
app.use('/api/v1/roles',roleRouter)
app.use('/api/v1/jobtype',authMiddleware,jobtyperouter) 
app.use('/api/v1/companytype',authMiddleware ,isAdmin,companyTypeRouter) 
app.use('/api/v1/companysettings',authMiddleware,isAdmin,companySettingsRouter)
app.use('/api/v1/company',authMiddleware,companyRouter) 
app.use('/api/v1/job',authMiddleware,jobRouter)
app.use('/api/v1/application',authMiddleware,applicationRouter)
app.use('/api/v1/error',errorRouter)

// Compatibility: support Google callback configured as /api/auth/callback/google
app.get('/api/auth/callback/google', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
    return res.redirect(`/api/v1/auth/google/callback${query}`)
})

export const httpserver=app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    initializeWebSocket(httpserver)
});

