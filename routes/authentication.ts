import {Router} from "express"
import {z} from "zod"
import { prisma } from "../utils/prismaClient"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sanitize } from "../utils/helperfunctions"
import { logError } from "../utils/logger"
export const router=Router()
const signinInputs=z.object({
    email:z.email(),
    password:z.string()
})
router.post('/signin',async (req,res)=>{
    try{
        const body=req.body
        const parsedBody=signinInputs.safeParse(body)
        if(!parsedBody.success){
            return res.status(400).json({
                message:"Invalid inputs detected"
            })
        }
        const {password,email}=parsedBody.data
        const user=await prisma.users.findUnique({
            where:{
                email,
                deleted:null
            },include:{
                role:{
                    select:{id:true,name:true,code:true}
                },
                company:{
                    select:{id:true,name:true}
                }
            }
        })
        if(!user || user.deleted){
            return res.status(401).json({
                message:"Invalid credentials"
            })
        }
        const isPasswordvalid=await bcrypt.compare(password,user.password)
        if(!isPasswordvalid){
            return res.status(401).json({
                message:"Invalid credentials"
            })
        }
        const token=jwt.sign({
            userId:user.id,
            email:user.email,
            role:user.role?.code,
            companyId:user.companyId || null
        },process.env.JWT_SECRET!,{
            expiresIn:'7d'
        })
        const result=sanitize(user)
        return res.status(201).json({
            token,
            result
        })
    }catch(e:any){
        console.log(e.message)
        await logError('login',e.message)
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})