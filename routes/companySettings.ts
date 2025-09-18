import {Router} from "express"
import { prisma } from "../utils/prismaClient"
import { sanitize } from "../utils/helperfunctions"
import { logError } from "../utils/logger"
export const companySettingsRouter=Router()
companySettingsRouter.get('/:companyId',async(req,res)=>{
    try{
        const companyId=req.params.companyId
        if(!companyId){
            return res.status(400).json({
                message:"company id is not found"
            })
        }
        const company=await prisma.companies.findUnique({
          where:{id:companyId},
          include:{
            settings:true
          }
        })
        if(!company){
           res.status(404).json({message:"Company not Found"})
           return;
        }
        const allSettings=company.settings.map(item=>{
          const results = sanitize(item);
          return results
        })
        res.status(201).json({
          allSettings
        })
      }catch(err:any){
        await logError('getAllSettings', err.message);
        res.status(500).json({message:"Internal server error"})
      }
})

companySettingsRouter.put('/:companySettingsId',async(req,res)=>{
    try{
        const companySettingsId=req.params.companySettingsId
        const companySettings=await prisma.companysettings.findUnique({
            where:{
                id:companySettingsId
            }
        })
        if(!companySettings){
             res.status(404).json({
                message:"Company not found"
            })
            return
        }
        await prisma.companysettings.update({
            where:{
                id:companySettingsId,
            },data:{
                value:!companySettings?.value
            }
        })
        res.status(201).json({
            message:"The company settings is successfully updated"
        })
    }catch(err:any){
        await logError('updateCompanysettings', err.message);
        res.status(500).json({message:"Internal server error"})
    }
})