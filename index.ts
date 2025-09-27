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
import cors from "cors"
const app=express()
app.use(express.json())
app.use(cors({
    origin: ['interviewer-frontend-lm5m.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.post('/text',authMiddleware,(req,res)=>{
return res.status(200).json({
    message:"Reached"
})
})
app.use("/api/v1/users",userRouter)
app.use('/api/v1/auth',authRouter)
app.use('/api/v1/userdetails',authMiddleware,userDetailsRouter)
app.use('/api/v1/roles',roleRouter)
app.use('/api/v1/jobtype',authMiddleware,jobtyperouter)
app.use('/api/v1/companytype',authMiddleware,companyTypeRouter)
app.use('/api/v1/companysettings',authMiddleware,companySettingsRouter)
app.use('/api/v1/company',authMiddleware,companyRouter)
app.use('/api/v1/job',authMiddleware,jobRouter)
app.use('/api/v1/application',authMiddleware,applicationRouter)
app.listen(process.env.PORT,()=>{
    console.log(`Server is listening on port ${process.env.PORT}`)
})