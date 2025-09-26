import {Router} from "express"
import { prisma } from "../utils/prismaClient";
import { sanitize } from "../utils/helperfunctions";
import { logError } from "../utils/logger";
export const jobRouter=Router()
jobRouter.post('/',async (req,res)=>{
    try {
        const {
          title,
          description,
          companyId,
          jobtypeId  ,
          location,
          isremote,
          salarymin,
          salarymax,
          salarycurrency,
          requirements,
          responsibilities,
          benefits,
          applicationurl,
          contactemail,
          applicationdeadline,
          experiencerequired,
          educationlevel,
          skills,
          isfeatured,
          postedById,
        } = req.body;
    
        if (!companyId || !jobtypeId || !title || !description) {
          res.status(400).json({ error: 'Missing required fields' });
          return;
        }
    
        const company = await prisma.companies.findFirst({
          where: { id: companyId, deleted: null },
        });
        
        if (!company) {
          res.status(400).json({ error: 'Invalid company Id' });
          return;
        }
    
        const jobtype = await prisma.jobtypes.findFirst({
          where: { id: jobtypeId, deleted: null },
        });
    
        if (!jobtype) {
          res.status(400).json({ error: 'Invalid job type Id' });
          return;
        }
    
        let postedByUser = null;
    
        if (postedById) {
          postedByUser = await prisma.users.findFirst({
            where: { id: postedById, deleted: null },
          });
          if (!postedByUser) {
            res.status(400).json({ error: 'Invalid postedBy Id' });
            return;
          }
        }
    
        if (company.postlimit==0){
          res.status(403).json({error:"Your limit is exceeded"});
          return
        }
    
        const job = await prisma.jobs.create({
          data: {
            title,
            description,
            companyid: company.id,
            jobtypeid: jobtype.id,
            location,
            isremote,
            salarymin,
            salarymax,
            salarycurrency,
            requirements,
            responsibilities,
            benefits,
            applicationUrl:applicationurl,
            contactemail,
            applicationdeadline: applicationdeadline ? new Date(applicationdeadline) : null,
            experiencerequired:Number(experiencerequired),
            educationlevel,
            skills,
            isfeatured,
            postedby: postedByUser?.id,
          },
        });
    
        if (company.postlimit){
          await prisma.companies.update({
            where:{
              id:company.id,
              deleted:null
            },
            data:{
              postlimit:company.postlimit-1
            }
          })
        }
    
        res.json(sanitize(job));
        
      } catch (err: any) {
        await logError('createJob', err.message);
        res.status(500).json({ error: 'Internal server error' });
      }
})
jobRouter.get('/:jobId',async (req,res)=>{
    try {
        const jobId = req.params.jobId;
    
        if (!jobId) {
          res.status(400).json({ error: 'Id is required' });
          return;
        }
    
        const job = await prisma.jobs.findFirst({
          where: { id: jobId, deleted: null },
        });
    
        if (!job) {
          res.status(404).json({ error: 'Job not found' });
          return;
        }
    
        res.json(sanitize(job));
      } catch (err: any) {
        await logError('getJobById', err.message);
        res.status(500).json({ error: 'Internal server error' });
      }
})
jobRouter.put('/:jobId',async(req,res)=>{
    try {
    const jobId = req.params.jobId;

    if (!jobId) {
      res.status(400).json({ error: 'GUID is required' });
      return;
    }

    const job = await prisma.jobs.findFirst({
      where: { id: jobId, deleted: null },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const {
      title,
      description,
      location,
      isremote,
      salarymin,
      salarymax,
      salarycurrency,
      requirements,
      responsibilities,
      benefits,
      applicationurl,
      contactemail,
      applicationdeadline,
      experiencerequired,
      educationlevel,
      skills,
      isactive,
      isfeatured,
    } = req.body;

    const updated = await prisma.jobs.update({
      where: { id: jobId },
      data: {
        title,
        description,
        location,
        isremote,
        salarymin,
        salarymax,
        salarycurrency,
        requirements,
        responsibilities,
        benefits,
        applicationUrl:applicationurl,
        contactemail,
        applicationdeadline: applicationdeadline ? new Date(applicationdeadline) : null,
        experiencerequired,
        educationlevel,
        skills,
        isactive,
        isfeatured,
        updated: new Date(),
      },
    });

    res.json(sanitize(updated));
  } catch (err: any) {
    await logError('updateJob', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
})
jobRouter.delete('/:jobId',async(req,res)=>{
  try {
    const jobId = req.params.jobId;

    if (!jobId) {
      res.status(400).json({ error: 'Id is required' });
      return;
    }

    const job = await prisma.jobs.findFirst({
      where: { id: jobId, deleted: null },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    await prisma.jobs.update({
      where: { id: jobId },
      data: { deleted: new Date() },
    });

    res.json({ message: 'Job soft-deleted successfully' });
  } catch (err: any) {
    await logError('softDeleteJob', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
})
jobRouter.get('/company/:companyId',async (req,res)=>{
  try {
    const companyId = req.params.companyId;
    
    if (!companyId) {
      res.status(400).json({ error: 'Company ID is required' });
      return;
    }

    const jobs = await prisma.jobs.findMany({
      where: { 
        companyid: companyId,
        deleted: null 
      },
      orderBy: { created: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        jobtype: {
          select: {
            id: true,
            name: true,
          },
        },
        postedBy: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    const result = sanitize(jobs);
    res.json(result);
  } catch (err: any) {
    await logError('getJobsByCompany', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
})

jobRouter.get('/',async (req,res)=>{
  try {
    
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const jobs = await prisma.jobs.findMany({
      where: { deleted: null },
      skip,
      take: limit,
      orderBy: { created: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        jobtype: {
          select: {
            id: true,
            name: true,
          },
        },
        postedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const result = sanitize(jobs);
    res.json(result);
  } catch (err: any) {
    await logError('getAllJobs', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
})