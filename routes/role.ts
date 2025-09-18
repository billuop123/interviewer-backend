import {Router} from "express"
import { prisma } from "../utils/prismaClient"
import { sanitize } from "../utils/helperfunctions"
import { logError } from "../utils/logger"
export const roleRouter=Router()
roleRouter.get('/getallroles',async (req,res)=>{
    try{
        const roles=await prisma.roles.findMany({

        })
        const results=sanitize(roles)
        return res.status(200).json({
            roles:results
        })
    }catch(e:any){
        await logError('getAllRoles',e.message)
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})