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
import { isAdmin, isUser } from "./middleware/rolesMiddleware"
const app=express()
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ limit: '500mb', extended: true }))

app.use(cors({
    origin: ['interviewer-frontend-lm5m.vercel.app','http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:true
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
app.use('/api/v1/jobtype',authMiddleware,isAdmin,jobtyperouter) 
app.use('/api/v1/companytype',authMiddleware ,isAdmin,companyTypeRouter) 
app.use('/api/v1/companysettings',authMiddleware,isAdmin,companySettingsRouter)
app.use('/api/v1/company',authMiddleware,companyRouter) 
app.use('/api/v1/job',authMiddleware,jobRouter)
app.use('/api/v1/application',authMiddleware,applicationRouter)
app.listen(2000, '0.0.0.0', () => console.log('Server running on 0.0.0.0'));