import express from "express"
import { userRouter } from "./routes/user"
import { router as authRouter } from "./routes/authentication"
import { userDetailsRouter } from "./routes/userDetails"
import { roleRouter } from "./routes/role"
import { jobtyperouter } from "./routes/jobstype"
import { companyTypeRouter } from "./routes/companytype"
import { companySettingsRouter } from "./routes/companySettings"
import { jobRouter } from "./routes/jobRouter"
import { companyRouter } from "./routes/company"
import { applicationRouter } from "./routes/application"
import { authMiddleware } from "./middleware/authMiddleware"
import { generalRateLimiter, authRateLimiter, strictRateLimiter, uploadRateLimiter } from "./middleware/rateLimiter"
import cors from "cors"
const app=express()

// Configure body size limits for video uploads (up to 5 minutes)
// 5 minutes of video can be 50-500MB depending on quality
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ limit: '500mb', extended: true }))

app.use(cors({
    origin: ['interviewer-frontend-lm5m.vercel.app','http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:true
}))

// Apply general rate limiting to all routes
app.use(generalRateLimiter)

app.post('/text',authMiddleware,(req,res)=>{
return res.status(200).json({
    message:"Reached"
})
})

// Apply specific rate limiters to different route groups
app.use("/api/v1/users",userRouter)
app.use('/api/v1/auth',authRateLimiter,authRouter) // Stricter rate limiting for auth
app.use('/api/v1/userdetails',authMiddleware,strictRateLimiter,userDetailsRouter) // Strict for user details
app.use('/api/v1/roles',roleRouter)
app.use('/api/v1/jobtype',authMiddleware,strictRateLimiter,jobtyperouter) // Strict for job types
app.use('/api/v1/companytype',authMiddleware,strictRateLimiter,companyTypeRouter) // Strict for company types
app.use('/api/v1/companysettings',authMiddleware,strictRateLimiter,companySettingsRouter) // Strict for company settings
app.use('/api/v1/company',authMiddleware,strictRateLimiter,companyRouter) // Strict for company operations
app.use('/api/v1/job',authMiddleware,strictRateLimiter,jobRouter) // Strict for job operations
app.use('/api/v1/application',authMiddleware,uploadRateLimiter,applicationRouter) // Upload rate limiting for applications
app.listen(3001, '0.0.0.0', () => console.log('Server running on 0.0.0.0'));