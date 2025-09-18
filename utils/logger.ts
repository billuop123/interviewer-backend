import type { StringMappingType } from "typescript"
import { prisma } from "./prismaClient"

type Severity="info" | "warning" | "error"
interface LogParams{
    message:string,
    description?:string,
    severity?:Severity,
    userId?:string|null
 }
 async function createLog({
    message,
    description="",
    severity="info",
    userId=null
 }:LogParams){
    try{
        await prisma.loginfo.create({
            data:{
                message,
                description,
                severity,
                userId,
                updated:new Date()
            }
        })
    }catch(e){
        console.error("Failed to log message")
    }
 }


 export async function logInfo(message:string,description?:string,userId?:string){
    await createLog({message,description,userId,severity:"info"})
 }
 export async function logError(message:string,description?:string,userId?:string){
    await createLog({message,description,userId,severity:"error"})
 }