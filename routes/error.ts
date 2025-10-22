import express, { type Request, type Response } from "express";
import { logError } from "../utils/logger";
import { prisma } from "../utils/prismaClient";
import { authMiddleware } from "../middleware/authMiddleware";
export const errorRouter=express.Router();
errorRouter.get('/', authMiddleware, async (req:Request,res:Response)=>{
try{
    const errors=await prisma.loginfo.findMany({});
    return res.status(200).json({
        errors
    })
}catch(e:any){
    await logError('getErrors',e.message)
    res.status(500).json({
        message:"Internal Server Error"
    })
}
})