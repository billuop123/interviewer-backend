import {Router} from "express"
import {z} from "zod"
import { prisma } from "../utils/prismaClient"
import { sanitize } from "../utils/helperfunctions"
import { logError } from "../utils/logger"
import { isAdmin, isRecruiter } from "../middleware/rolesMiddleware"
export const jobtyperouter=Router()
const createJobInputs=z.object({
    name:z.string(),
    description:z.string()
})
jobtyperouter.post('/',isRecruiter,async (req,res)=>{
    try{
        const body=req.body
        const parsedBody=createJobInputs.safeParse(body)
        if(!parsedBody.success){
            return res.status(400).json({
               message:"invalid Inputs" 
            })
        }
        const {name,description}=parsedBody.data
        const existingJobtype=await prisma.jobtypes.findUnique({where:{name}})
        if(existingJobtype){
            return res.status(403).json({
                message:"Job type already exists"
            })
        }
        const newJobtype=await prisma.jobtypes.create({
            data:{
                name,
                description
            }
        })
        const result=sanitize(newJobtype)
        return res.status(200).json({
            newJob:result
        })
    }catch(e:any){
        await logError('createJobtype',e.message)
        return res.status(500).json({
            message:"Interal server error"
        })
    }
})
jobtyperouter.get('/getAllJobs',isAdmin,async (req,res)=>{
    try{
        const allJobs=await prisma.jobtypes.findMany({
            where:{
                deleted:null
            }
        })
        const result=sanitize(allJobs)
        return res.status(200).json({
            allJobs:result
        })
    }catch(e:any){
        await logError('getalljob',e.message)
        return res.status(500).json({
            message:"Interal server error"
        })
    }
})
jobtyperouter.get('/getjob/:jobtypeId',isAdmin,async(req,res)=>{
    try{
        const jobtypeId=req.params.jobtypeId
        if(!jobtypeId){
            return res.status(404).json({
                message:"jobtypeId is not found"
            })
        }
        const jobtype=await prisma.jobtypes.findUnique({
            where:{
                id:jobtypeId,
                deleted:null
            }
        })
        if(!jobtype){
            return res.status(401).json({
                message:"jobtypeId not found"
            })
        }
        const result=sanitize(jobtype)
        return res.status(200).json({
            jobtype:result
        })
    }catch(e:any){
        await logError('getjob',e.message)
        return res.status(500).json({
            message:"Interal server error"
        })
    }
})
jobtyperouter.put('/updatejobtype/:jobtypeid',isAdmin,async (req,res)=>{
    try {
        const jobtypeid = req.params.jobtypeid;
        const { name, description } = req.body;
        if(!name || !description){
            return res.status(404).json({
                message:"required fields are missing"
            })
        }
        const existing = await prisma.jobtypes.findFirst({
          where: {
            name,
            deleted: null,
            id: { not: jobtypeid },
          },
        });
    
        if (existing) {
          res.status(400).json({ error: 'Job type name already in use' });
          return;
        }
    
        const updated = await prisma.jobtypes.update({
          where: { id:jobtypeid,deleted: null },
          data: {
            name,
            description,
            modified: new Date(),
          },
        });
    
        const result = sanitize(updated);
        res.json(result);
      } catch (e: any) {
        await logError('updateJobType', e.message);
        res.status(500).json({ message: 'Internal server error' });
      }
})
jobtyperouter.delete('/:jobtypeid',isAdmin,async(req,res)=>{
    try {
        const jobtypeid = req.params.jobtypeid;
    
        await prisma.jobtypes.update({
          where: { id:jobtypeid },
          data: { deleted: new Date() },
        });
    
        res.json({ message: 'Job type soft-deleted successfully' });
      } catch (err: any) {
        await logError('softDeleteJobType', err.message);
        res.status(500).json({ error: 'Internal server error' });
      }
})