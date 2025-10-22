import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
declare module "express-serve-static-core" {
    interface Request {
      userId: string;
      email:string
      roleCode:string,
      companyId:string | null  
    }
  }

export async function authMiddleware(req:Request,res:Response,next:NextFunction){
    const token=req.headers.authorization
    if(!token){
        return res.status(401).json({
            message:"Token is not found"
        })
    }
    try{
        const decoded=jwt.verify(token!,process.env.JWT_SECRET!)as JwtPayload
        if(decoded?.userId!){
            req.userId=decoded.userId
            req.roleCode=decoded.role
      
            next()
        }
    }catch(e){
        return res.status(401).json({message:"Invalid or expired token"})
    }
}