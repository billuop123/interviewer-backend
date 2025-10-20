import type { NextFunction, Request, Response } from "express";
export const isRecruiter=(req:Request,res:Response,next:NextFunction)=>{
    const roleCode=req.roleCode
    console.log(roleCode)
    if(roleCode!="RECRUITER"){
        return res.status(403).json({message:"You are a recruiter and not authorized to access this resource"})
    }
    next()
}
export const isUser=(req:Request,res:Response,next:NextFunction)=>{
    const roleCode=req.roleCode
    console.log(roleCode)
    if(roleCode!="USER"){
        return res.status(403).json({message:"You are a user and not authorized to access this resource"})
    }
    next()
}
export const isAdmin=(req:Request,res:Response,next:NextFunction)=>{
    const roleCode=req.roleCode
    console.log(roleCode)
    if(roleCode!="ADMIN"){
        return res.status(403).json({message:"You are a admin and not authorized to access this resource"})
    }
    next()
}
