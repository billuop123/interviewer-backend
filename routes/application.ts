import { Router } from "express";
import { prisma } from "../utils/prismaClient";
import { sanitize } from "../utils/helperfunctions";
import { logError } from "../utils/logger";
import axios from "axios";
import pdf from "pdf-parse";
import OpenAI from "openai";
export const applicationRouter = Router();
const TOPIC_NAME="PDF-PARSING"
applicationRouter.post("/",async (req, res) => {
  try {
    const userId=req.userId
    const { jobId, coverletter, notes } = req.body;
    if (!jobId || !userId) {
      res
        .status(400)
        .json({ message: "Missing required fields: jobid or userid" });
      return;
    }

    const job = await prisma.jobs.findFirst({
      where: { id: jobId, deleted: null },
    });

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    const user = await prisma.users.findFirst({
      where: { id: userId, deleted: null },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // const status = await prisma.applicationstatus.findFirst({
    //   where: { code: "SUBMITTED", deleted: null },
    // });

    // if (!status) {
    //   res.status(500).json({ message: "Submitted status not found" });
    //   return;
    // }

    const existing = await prisma.applications.findFirst({
      where: {
        jobid: job.id,
        userid: user.id,
        deleted: null,
      },
    });

    if (existing) {
      res.status(400).json({ message: "Application already exists" });
      return;
    }

    const created = await prisma.applications.create({
      data: {
        jobid: job.id,
        userid: user.id,
        coverletter,
        notes,
      },
    });
    // const emailTemplate=await prisma.emailtemplates.findUnique({
    //   where:{
    //     code:"JOB_APPLICATION_SUBMITTED",
    //     deleted:null
    //   }
    // })
    // const emailTracking=await prisma.emailTracking.create({
    //   data:{
    //     recipientId:user.id,
    //     templateId:emailTemplate!.id,

    //   }
    // })
    //     const replacements:{name:string,job_title:string}={
    //       name:user.name,
    //       job_title:job.title
    //     }
    //     type Placeholder = 'name' | 'job_title';
    //     const emailBody = emailTemplate?.body.replace(/\{\{(name|job_title)\}\}/g,(_, key:keyof typeof replacements) => {
    //       return replacements[key as Placeholder] || '';
    //   });
    //     console.log(emailBody)
    //     sendEmail({recipientGmail:user.email,emailSubject:emailTemplate?.subject as string,emailBody:emailBody!,trackingId:emailTracking.id})
    return res.json(sanitize(created));
  } catch (err: any) {
    await logError("createApplication", err.message);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});
applicationRouter.get("/:applicationId", async (req, res) => {
  try {
    const applicationId = req.params.applicationId;

    if (!applicationId) {
      res.status(400).json({ error: "applicationId is required" });
      return;
    }

    const data = await prisma.applications.findFirst({
      where: { id: applicationId, deleted: null },
      include: {
        job: { select: { id: true, title: true } },
        user: { select: { id: true, email: true } },
      },
    });

    if (!data) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    res.json(sanitize(data));
    return;
  } catch (err: any) {
    await logError("getApplicationByGuid", err.message);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});
applicationRouter.put("/:applictionId", async (req, res) => {
  try {
    const applictionId = req.params.applictionId;

    if (!applictionId) {
      res.status(400).json({ error: "GUID is required" });
      return;
    }

    const existing = await prisma.applications.findFirst({
      where: { id: applictionId, deleted: null },
    });

    if (!existing) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const { coverletter, notes } = req.body;

    const updated = await prisma.applications.update({
      where: { id: applictionId },
      data: {
        coverletter,
        notes,
        updated: new Date(),
      },
    });

    res.json(sanitize(updated));
    return;
  } catch (err: any) {
    await logError("updateApplication", err.message);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});
applicationRouter.delete("/:applicationId", async (req, res) => {
  try {
    const applicationId = req.params.applicationId;

    if (!applicationId) {
      res.status(400).json({ error: "applicationId is required" });
      return;
    }

    const existing = await prisma.applications.findFirst({
      where: { id: applicationId, deleted: null },
    });

    if (!existing) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    await prisma.applications.update({
      where: { id: applicationId },
      data: { deleted: new Date() },
    });

    res.json({ message: "Application soft-deleted successfully" });
    return;
  } catch (err: any) {
    await logError("softDeleteApplication", err.message);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});
applicationRouter.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const data = await prisma.applications.findMany({
      where: { deleted: null },
      skip,
      take: limit,
      orderBy: { created: "desc" },
      include: {
        job: { select: { id: true, title: true } },
        user: { select: { id: true, email: true } },
      },
    });

    res.json(sanitize(data));
    return;
  } catch (err: any) {
    await logError("getAllApplications", err.message);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});
applicationRouter.post("/chat/:applicationId", async (req, res) => {
  try {
    const applicationId=req.params.applicationId
    const {resumeText}=req.body
    if(!applicationId){
      return res.status(400).json({
        message:"The application Id is required"
      })
    }
    const application=await prisma.applications.findUnique({
      where:{
        id:applicationId
      },
      include:{
        job:{
          select:{
          title :true,
          description :true,
          companyid :true,
          jobtypeid :true,
          location :true,
          isremote :true,
          salarymin :true,
          salarymax :true,
          salarycurrency :true,
          requirements :true,
          responsibilities :true,
          benefits :true,
          applicationUrl :true     , 
          experiencerequired :true,
          educationlevel :true   ,  
          skills :true 
          }            
        }
      }
    })
    if(!application){
      return res.status(404).json({
        message:"application is not found"
      })
    }
    // const {
    //   coverletter,
    //   notes,
    //   job: {
    //     title,
    //     description,
    //     salarymin,
    //     salarymax,
    //     requirements,
    //     responsibilities,
    //     benefits,
    //     experiencerequired,  
    //     educationlevel,
    //     skills,
    //   },
    // } = application;
    
    const { message } = req.body;
    const outputText=await runOpenAiPrompt(message,resumeText,application)
    return res.json({ llmResponse:outputText });
  } catch (e: any) {
    await logError('chat',e.message)
    return res.status(500).json({ message: e.message });
  }
});


async function runOpenAiPrompt(prompt:any,resumeText:string,application:any){
  const client = new OpenAI   ();
  const SystemPrompt =
      `You are an interviewer for an hiring company.you get the resume content based on that you are going to interview the candidate for certain post.You are going to ask the candidate fron 10-15 
      technical question and 2-3 personal questions resumeContent:${resumeText}.And donot make the response in more words keep it short and sensible.The information for the jobs are title:${application.job.title}
      ,description:${application.job.description},isRemote:${application.job.isRemote},salarymin:${application.job.salarymin} ,salaryMax:${application.job.salarymax},requirements:${application.job.requirements},
      experienceRequired:${application.job.experiencerequired} educationlevel:${application.job.educationlevel},skills:${application.job.skills} ,if any of these field is null then ignore it.The questions should
      be focused mostly on their skills and respnsibilities.The information of the users are coverletter:${application.coverletter} ,notes:${application.notes},other things should bve taken from the resume.
      if you think you have asked enough question then simply return The interiew is over ,now you can press the end interview button to end the interview, and if candidate kepp on saying stuff then simply return the same thing
      and keep your questions very short!!One question should be given at a time.`
  const response = await client.responses.create({
        model: "gpt-5",
        input: [
          {
            role: "system",
            content:SystemPrompt
          },
          { role: "user", content: prompt },
        ],
      });
    return response.output_text
}
applicationRouter.post('/parseresume',async(req,res)=>{
  try{
    const {resumelink}=req.body
    const response = await axios.get(resumelink, {
      responseType: "arraybuffer",
    });
    const pdfBuffer = response.data;
    if (pdfBuffer.length < 5 || pdfBuffer.slice(0, 5).toString() !== "%PDF-") {
      return res
        .status(400)
        .json({ error: "The provided file is not a valid PDF" });
    }
    const parsed = await pdf(pdfBuffer);
    const resumeText = parsed.text;
    return res.json({
      resumeText
    })
  }catch(e:any){
    await logError('parsepdf',e.message)
    return res.status(500).json({ message: e.message });
  }
})
const client = new OpenAI   ();
applicationRouter.get('/:applicationId/resume',async(req,res)=>{
  try{
    const applicationId=req.params.applicationId
    const {messageHistory,resumeText}=req.body
    if(!applicationId){
      return res.status(400).json({
        message:"The application Id is required"
      })
    }
    const application=await prisma.applications.findUnique({
      where:{id:applicationId},
      include:{
        job:{
          select:{
          title :true,
          description :true,
          companyid :true,
          jobtypeid :true,
          location :true,
          isremote :true,
          salarymin :true,
          salarymax :true,
          salarycurrency :true,
          requirements :true,
          responsibilities :true,
          benefits :true,
          applicationUrl :true     , 
          experiencerequired :true,
          educationlevel :true   ,  
          skills :true 
          }    
        }
      }
    })
    if(!application){
      return res.status(404).json({
        message:"Application not found"
      })
    }
    const SystemPrompt =`based on the resume content and the message history now you have to rate the interview on the basis if the candidate is eligible fot the job or not.The 
    resume content is ${resumeText} and the message history is ${messageHistory} and the jobs details are ${application.job} the output of your response should be in the json format 
    strictly for example:{score:6,reasoning:"The candidate is eligible for the job because of the following reasons"}
    `
 
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:SystemPrompt
        },
        { role: "user", content: messageHistory },
      ],
    });
    const relevanceScore=JSON.parse(response.output_text).score
    const relevanceComment=JSON.parse(response.output_text).reasoning
    await prisma.applications.update({
      where:{id:applicationId},
      data:{
        relevancescore:relevanceScore,
        relevancecomment:relevanceComment
      }
    })
    return res.json({
      resume:response.output_text
    })
  }
  catch(e:any){
    await logError('getResume',e.message)
    return res.status(500).json({ message: e.message });
  }
})