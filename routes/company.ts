import {Router} from "express"
import { prisma } from "../utils/prismaClient";
import { sanitize } from "../utils/helperfunctions";
import { logError } from "../utils/logger";
import { authMiddleware } from "../middleware/authMiddleware";
export const companyRouter=Router()
const companySettings = ["sendEmailNotification", "enableCoverLetter"];
const systemSettings = ["allowJobPosts", "enableFeaturedJobs"];
companyRouter.post('/', authMiddleware, async (req,res)=>{
    try {
        const { name, email, website, logo, postlimit, blacklisted } = req.body;
        const userId = req.userId; // Get user ID from auth middleware
    
        if (!email || typeof email !== "string" || email.trim() === "") {
          res.status(400).json({ error: "Email is required" });
          return;
        }
    
        const existingCompany = await prisma.companies.findUnique({
          where: { email },
        });
    
        if (existingCompany) {
          res.status(400).json({ error: "Email already in use" });
          return;
        }
    
        const company = await prisma.companies.create({
          data: {
            name,
            email,
            website,
            logo,
            postlimit,
            blacklisted,
          },
        });
        
        // Associate the user with the company they created
        if (userId) {
          await prisma.users.update({
            where: { id: userId },
            data: { companyId: company.id }
          });
        }
        systemSettings.map(async (item) => {
          await prisma.companysettings.create({
            data: {
              companyId: company.id,
              key: item,
              isSystemSetting: true,
            },
          });
        });
        companySettings.map(async (item) => {
          await prisma.companysettings.create({
            data: {
              companyId: company.id,
              key: item,
              isSystemSetting: false,
            },
          });
        });
        const results = sanitize(company);
         res.status(201).json(results);
      } catch (err: any) {
        await logError("createCompany", err.message);
        res.status(500).json({ error: "Internal server error" });
      }
})


companyRouter.get('/', authMiddleware, async (req,res)=>{
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;
        const userId = req.userId; // Use authenticated user's ID
        
    
        let companies:any[];
        
        // If userId is provided, filter companies by user
        if (userId) {
          // First get the user to find their companyId
          const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { companyId: true }
          });
          
          if (!user || !user.companyId) {
            // User has no company, return empty array
            companies = [];
          } else {
            // Get the company for this user
            companies = await prisma.companies.findMany({
              where: { 
                id: user.companyId,
                deleted: null 
              },
              skip,
              take: limit,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            });
          }
        } else {
          // No userId provided, get all companies
          companies = await prisma.companies.findMany({
            where: { deleted: null },
            skip,
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });
        }
    
        const results = sanitize(companies);
        res.json(results);
      } catch (err: any) {
        await logError("getAllCompanies", err.message);
        res.status(500).json({ error: "Internal server error" });
      }
})
companyRouter.get('/:companyId',async(req,res)=>{
    try {
        const companyId = req.params.companyId;
    
        const company = await prisma.companies.findUnique({
          where: { id:companyId },
        });
    
        if (!company || company.deleted) {
          res.status(404).json({ error: "Company not found" });
          return;
        }
    
        const results = sanitize(company);
    
        res.json(results);
      } catch (err: any) {
        await logError("getCompanyById", err.message);
        res.status(500).json({ error: "Internal server error" });
      }
})
companyRouter.put('/:companyId',async(req,res)=>{
    try {
        const companyId = req.params.companyId;
        const { name, email, website, logo, postlimit, blacklisted } = req.body;
    
        // Check if email is already in use by another company
        const existingCompany = await prisma.companies.findFirst({
          where: { 
            email,
            id: { not: companyId }
          },
        });
    
        if (existingCompany) {
          res.status(400).json({ error: "Email already in use" });
          return;
        }
    
        const updated = await prisma.companies.update({
          where: { id:companyId },
          data: {
            name,
            email,
            website,
            logo,
            postlimit,
            blacklisted,
            updated: new Date(),
          },
        });
    
        const results = sanitize(updated);
        res.json(results);
      } catch (err: any) {
        await logError("updateCompany", err.message);
        res.status(500).json({ error: "Internal server error" });
      }
})
companyRouter.delete('/:companyId',async(req,res)=>{
    try {
    
        const companyId = req.params.companyId;
        await prisma.companies.update({
          where: { id:companyId },
          data: { deleted: new Date() },
        });
    
        res.json({ message: "Company soft-deleted successfully" });
      } catch (err: any) {
        await logError("softDeleteCompany", err.message);
        res.status(500).json({ error: "Internal server error" });
      }
})