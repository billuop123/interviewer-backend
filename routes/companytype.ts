import {Router} from "express"
import {z} from "zod"
import { prisma } from "../utils/prismaClient"
import { sanitize } from "../utils/helperfunctions"
import { logError } from "../utils/logger"
export const companyTypeRouter=Router()
const companyTypeCreateSchema=z.object({
    name:z.string(),
    description:z.string()
})
companyTypeRouter.post('/',async (req,res)=>{
try{
    const body=req.body
    const parsedBody=companyTypeCreateSchema.safeParse(body)
    if(!parsedBody.success){
        return res.status(400).json({
            message:"invalid input"
        })
    }
    const {name,description}=parsedBody.data
    const existingCompany=await prisma.companytypes.findUnique({
        where:{
            name
        }
    })
    if(existingCompany){
        return res.status(409).json({
            message:"Company with the following name alerady exists"
        })
    }
    const companyType = await prisma.companytypes.create({
        data: { name, description },
      });
    const results=sanitize(companyType)  
    res.status(200).json(
        results
    )
}catch(err:any){
    await logError('createCompanyType', err.message);
    res.status(500).json({ error: 'Internal server error' });
}
})

companyTypeRouter.get('/getAllcompanytype',async(req,res)=>{
    try{
        const limit = parseInt(req.query.limit as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;
        const companyTypes = await prisma.companytypes.findMany({
          where: { deleted: null },
          skip,
          take: limit,
        });
    
        const results = sanitize(companyTypes);
        res.json(results);
    }catch(err:any){
        await logError('getAllCompanyTypes', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
})
companyTypeRouter.get('/:companyId',async(req,res)=>{
    try{
        const companyId = req.params.companyId;

        const companyType = await prisma.companytypes.findUnique({
          where: {id:companyId,deleted:null },
        });
    
        if (!companyType || companyType.deleted) {
           res.status(404).json({ error: 'Company type not found' });
           return
        }
    
        const results = sanitize(companyType);
        res.json(results);
    }catch(err:any){
        await logError('getCompanyTypeById', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
})
companyTypeRouter.put('/:companyId',async(req,res)=>{
    try {
        const companyId = req.params.companyId;
        const { name, description } = req.body;
        if(!name || ! description){
            return res.status(404).json({
                message:"Required fields are missing"
            })
        }
        if(!companyId){
            return res.status(404).json({
                message:"company id is not found"
            })
        }
        const company=await prisma.companytypes.findUnique({
            where:{
                id:companyId
            }
        })
        if(!company){
            return res.status(404).json({
                message:"Company is not found"
            })
        }
        const updated = await prisma.companytypes.update({
          where: { id:companyId, deleted: null },
          data: { name, description },
        });
    
        const results = sanitize(updated);
        res.json(results);
      } catch (err: any) {
        await logError('updateCompanyType', err.message);
        res.status(500).json({ error: 'Internal server error' });
      }
})
companyTypeRouter.delete('/:companyId',async (req,res)=>{
    try{
        const companyId = req.params.companyId;
        if(!companyId){
            return res.status(404).json({
                message:"company id is not found"
            })
        }
        const companytype=await prisma.companytypes.findUnique({
            where:{
                id:companyId
            }
        })
        if(!companytype){
            return res.status(404).json({
                message:"No company type found"
            })
        }
        await prisma.companytypes.update({
      where: { id:companyId, deleted: null },
      data: { deleted: new Date() },
    });

    res.json({ message: 'Soft deleted successfully'}); 
    }catch(err:any){
    await logError('softDeleteCompanyType', err.message);
    res.status(500).json({ error: 'Internal server error' });
    }
})