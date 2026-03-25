import { Router } from "express";
import { prisma } from "../utils/prismaClient";
import { runOpenAiPrompt, sanitize, streamOpenAiResponse, uploadVideos } from "../utils/helperfunctions";
import { logError } from "../utils/logger";
import { authMiddleware } from "../middleware/authMiddleware";
import axios from "axios";
import pdf from "pdf-parse";
import formidable from "formidable";
import { isUser } from "../middleware/rolesMiddleware";
import OpenAI from "openai";
import { Kafka } from "kafkajs";
export const applicationRouter = Router();
const kafka = new Kafka({
  clientId: "interviewer-service",
  brokers: ["localhost:9092"]
})
const producer = kafka.producer();
applicationRouter.get("/user",authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const data = await prisma.applications.findMany({
      where: { 
        userid: userId,
        deleted: null 
      },
      skip,
      take: limit,
      orderBy: { created: "desc" },
      include: {
        job: { 
          select: { 
            id: true, 
            title: true,
            description: true,
            companyid: true,
            company: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          } 
        },
        user: { select: { id: true, email: true } },
      },
    });

    res.json(sanitize(data));
    return;
  } catch (err: any) {
    await logError("getUserApplications", err.message);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});
applicationRouter.post("/",authMiddleware,isUser,async (req, res) => {
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

    // bump job applicationscount
    await prisma.jobs.update({
      where: { id: job.id },
      data: { applicationscount: { increment: 1 } },
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
      select: {
        id: true,
        jobid: true,
        userid: true,
        coverletter: true,
        relevancescore: true,
        relevancecomment: true,
        interviewdate: true,
        notes: true,
        created: true,
        updated: true,
        videolink: true,
        job: { 
          select: { 
            id: true, 
            title: true,
            description: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          } 
        },
        user: { select: { id: true, email: true, name: true } },
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

    // decrement job applicationscount (not below zero)
    const job = await prisma.jobs.findUnique({ where: { id: existing.jobid } });
    if (job) {
      await prisma.jobs.update({
        where: { id: job.id },
        data: { applicationscount: job.applicationscount > 0 ? { decrement: 1 } : undefined },
      });
    }

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

applicationRouter.get("/job/:jobId", async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.userId;
    
    if (!jobId) {
      res.status(400).json({ error: "Job ID is required" });
      return;
    }
    
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const job = await prisma.jobs.findFirst({
      where: { 
        id: jobId, 
        deleted: null,
        postedby: userId 
      }
    });

    if (!job) {
      res.status(403).json({ error: "Access denied: You can only view applications for jobs you posted" });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const data = await prisma.applications.findMany({
      where: { 
        jobid: jobId,
        deleted: null 
      },
      skip,
      take: limit,
      orderBy: { created: "desc" },
      include: {
        user: { 
          select: { 
            id: true, 
            email: true,
            name: true
          } 
        },
      },
    });

    res.json(sanitize(data));
    return;
  } catch (err: any) {
    await logError("getJobApplications", err.message);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});
applicationRouter.post("/chat/:applicationId", async (req, res) => {
  try {
    const applicationId=req.params.applicationId
    const {resumeText,message,messageHistory}=req.body
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
    
 
    const outputText=await runOpenAiPrompt(messageHistory || [{ role: "user", content: message }],resumeText,application)
    return res.json({ llmResponse:outputText });
  } catch (e: any) {
    await logError('chat',e.message)
    return res.status(500).json({ message: e.message });
  }
}); 

applicationRouter.post("/chat/stream/:applicationId", async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const { resumeText, message, messageHistory } = req.body;
    
    if (!applicationId) {
      return res.status(400).json({
        message: "The application Id is required"
      });
    }

    const application = await prisma.applications.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            title: true,
            description: true,
            companyid: true,
            jobtypeid: true,
            location: true,
            isremote: true,
            salarymin: true,
            salarymax: true,
            salarycurrency: true,
            requirements: true,
            responsibilities: true,
            benefits: true,
            applicationUrl: true,
            experiencerequired: true,
            educationlevel: true,
            skills: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        message: "application is not found"
      });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Stream the LLM response
    await streamOpenAiResponse(messageHistory || [{ role: "user", content: message }], resumeText, application, res);
    
  } catch (e: any) {
    await logError('streamChat', e.message);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});






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
    const SystemPrompt = `You are an expert hiring manager evaluating a candidate's interview performance and resume for job suitability.

EVALUATION TASK:
Analyze the candidate's interview performance and resume to determine their suitability for the position.

JOB DETAILS:
- Position: ${application.job.title}
- Description: ${application.job.description || 'Not provided'}
- Required Skills: ${application.job.skills || 'Not specified'}
- Experience Required: ${application.job.experiencerequired || 'Not specified'}
- Education Level: ${application.job.educationlevel || 'Not specified'}
- Requirements: ${application.job.requirements || 'Not specified'}

CANDIDATE DATA:
- Resume Content: ${resumeText}
- Interview Conversation: ${messageHistory}

EVALUATION CRITERIA:
1. Technical competency and relevant skills
2. Experience alignment with job requirements
3. Communication and problem-solving abilities
4. Cultural fit and soft skills
5. Overall qualification for the role

OUTPUT FORMAT (JSON ONLY):
{
  "score": [number from 1-10, where 10 is excellent fit],
  "reasoning": "[Detailed explanation of the score, highlighting strengths and weaknesses based on interview responses and resume]"
}

Provide a fair, objective assessment based on the candidate's demonstrated abilities during the interview and their background.`
 
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
// applicationRouter.post('/:applicationId/submit',async(req,res)=>{
//   try{
    
//     const applicationId=req.params.applicationId  
//     const form=formidable({
//       multiples: false,
//       maxFileSize: 500 * 1024 * 1024, // 500MB limit for videos
//       maxFieldsSize: 10 * 1024 * 1024, // 10MB for text fields
//       keepExtensions: true,
//       allowEmptyFiles: false
//     })
//     form.parse(req,async(err:any,fields:any,files:any)=>{
//       if(err){
//         console.error('Formidable parsing error:', err.message)
//         return res.status(400).json({message:"Error parsing data"})
//       }
//       const resumeText=Array.isArray(fields.resume)?fields.resume[0]:fields.resumeText
//       const messageHistory=Array.isArray(fields.messageHistory)?fields.messageHistory[0]:fields.messageHistory
//       const video=Array.isArray(files.video)?files.video[0]:files.video
//       if(!resumeText || !messageHistory){
//         return res.status(400).json({message:"Resume text and message history are required"})
//       }
      
//       let videoLink = null
//       if(video && video.filepath){
//         try {

//           const videoSizeMB = video.size / (1024 * 1024)
//           if (videoSizeMB > 500) {
//             return res.status(400).json({
//               message: `Video file too large (${videoSizeMB.toFixed(1)}MB). Maximum size is 500MB.`
//             })
//           }
          

//           const allowedTypes = ['video/webm', 'video/mp4', 'video/avi', 'video/mov', 'video/quicktime']
//           if (!allowedTypes.includes(video.mimetype)) {
//             return res.status(400).json({
//               message: `Invalid video format. Allowed formats: ${allowedTypes.join(', ')}`
//             })
//           }
          
//           videoLink = await uploadVideos(video.filepath,`video_${applicationId}`) as string
//         } catch (uploadError: any) {
//           console.error('Video upload error:', uploadError.message)
//           return res.status(500).json({
//             message: `Video upload failed: ${uploadError.message}`
//           })
//         }
//       }
//       const application=await prisma.applications.findUnique({
//         where:{id:applicationId},
//         include:{
//           job:{
//             select:{
//               title:true,
//               description:true,
//               companyid:true,
//               jobtypeid:true,
//               location:true,
//               isremote:true,
//               salarymin:true,
//               salarymax:true,
//               salarycurrency:true,
//               requirements:true,
//               responsibilities:true,
//               benefits:true,
//               applicationUrl:true,
//               experiencerequired:true,
//               educationlevel:true,
//               skills:true
//             }
//           }
//         }
//       })
//       if(!application){
//         return res.status(404).json({message:"Application not found"})
//       }
//       const updatedApplication=await prisma.applications.update({
//         where:{id:applicationId},
//         data:{
//           videolink:videoLink // Will be null if no video was provided
//         }
//       })
//       const SystemPrompt = `You are an expert hiring manager evaluating a candidate's interview performance and resume for job suitability.

// EVALUATION TASK:
// Analyze the candidate's interview performance and resume to determine their suitability for the position.

// JOB DETAILS:
// - Position: ${application.job.title}
// - Description: ${application.job.description || 'Not provided'}
// - Required Skills: ${application.job.skills || 'Not specified'}
// - Experience Required: ${application.job.experiencerequired || 'Not specified'}
// - Education Level: ${application.job.educationlevel || 'Not specified'}
// - Requirements: ${application.job.requirements || 'Not specified'}

// CANDIDATE DATA:
// - Resume Content: ${resumeText}
// - Interview Conversation: ${messageHistory}

// EVALUATION CRITERIA:
// 1. Technical competency and relevant skills
// 2. Experience alignment with job requirements
// 3. Communication and problem-solving abilities
// 4. Cultural fit and soft skills
// 5. Overall qualification for the role

// OUTPUT FORMAT (JSON ONLY):
// {
//   "score": [number from 1-10, where 10 is excellent fit],
//   "reasoning": "[Detailed explanation of the score, highlighting strengths and weaknesses based on interview responses and resume]"
// }

// Provide a fair, objective assessment based on the candidate's demonstrated abilities during the interview and their background.`
//       const response = await client.responses.create({
//         model: "gpt-4o-mini",
//         input: [
//           { role: "system", content: SystemPrompt },
//           { role: "user", content: messageHistory },
//         ],
//       });
//       // Extract JSON from AI response (remove markdown code blocks if present)
//       let jsonText = response.output_text.trim()
      
//       // Remove markdown code blocks if present
//       if (jsonText.startsWith('```json')) {
//         jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
//       } else if (jsonText.startsWith('```')) {
//         jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
//       }
      
//       // Parse the cleaned JSON
//       let parsedResponse
//       try {
//         parsedResponse = JSON.parse(jsonText)
//       } catch (parseError) {
//         console.error("Failed to parse AI response as JSON:", jsonText)
//         console.error("Parse error:", parseError)
//         // Fallback: try to extract score and reasoning using regex
//         const scoreMatch = jsonText.match(/"score":\s*(\d+(?:\.\d+)?)/)
//         const reasoningMatch = jsonText.match(/"reasoning":\s*"([^"]+)"/)
        
//         parsedResponse = {
//           score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
//           reasoning: reasoningMatch ? reasoningMatch[1] : "Unable to parse reasoning"
//         }
//       }
      
//       const relevanceScore = parsedResponse.score
//       const relevanceComment = parsedResponse.reasoning
      
//       await prisma.applications.update({
//         where:{id:applicationId},
//         data:{
//           relevancescore:relevanceScore,
//           relevancecomment:relevanceComment
//         }
//       })
//       return res.json({
//         resume:response.output_text
//       })
//     })
//   }catch(e:any){
//     await logError('submitApplication',e.message)
//     return res.status(500).json({ message: e.message });
//   }
// })
applicationRouter.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if(text.length==0)return;
    if (!text || text.trim() === '') {
      res.status(400).send("Text is required and cannot be empty");
      return;
    }

    const response = await client.audio.speech.create({
      model: "tts-1",
      voice: "coral",
      input: text,
      response_format: "wav",
    });

    // Convert to buffer for sending as audio
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/wav");
    res.send(buffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).send("Error generating speech");
  }
});

applicationRouter.post('/:applicationId/submit',async(req,res)=>{
  try{
    
    const applicationId=req.params.applicationId  
    const form=formidable({
      multiples: false,
      maxFileSize: 500 * 1024 * 1024, // 500MB limit for videos
      maxFieldsSize: 10 * 1024 * 1024, // 10MB for text fields
      keepExtensions: true,
      allowEmptyFiles: false
    })
    form.parse(req,async(err:any,fields:any,files:any)=>{
      if(err){
        console.error('Formidable parsing error:', err.message)
        return res.status(400).json({message:"Error parsing data"})
      }
      const resumeText=Array.isArray(fields.resume)?fields.resume[0]:fields.resumeText
      const messageHistory=Array.isArray(fields.messageHistory)?fields.messageHistory[0]:fields.messageHistory
      const video=Array.isArray(files.video)?files.video[0]:files.video
      if(!resumeText || !messageHistory){
        return res.status(400).json({message:"Resume text and message history are required"})
      }
      
      let videoLink = null
      if(video && video.filepath){
        try {

          const videoSizeMB = video.size / (1024 * 1024)
          if (videoSizeMB > 500) {
            return res.status(400).json({
              message: `Video file too large (${videoSizeMB.toFixed(1)}MB). Maximum size is 500MB.`
            })
          }
          

          const allowedTypes = ['video/webm', 'video/mp4', 'video/avi', 'video/mov', 'video/quicktime']
          if (!allowedTypes.includes(video.mimetype)) {
            return res.status(400).json({
              message: `Invalid video format. Allowed formats: ${allowedTypes.join(', ')}`
            })
          }
          
          videoLink = await uploadVideos(video.filepath,`video_${applicationId}`) as string
        } catch (uploadError: any) {
          console.error('Video upload error:', uploadError.message)
          return res.status(500).json({
            message: `Video upload failed: ${uploadError.message}`
          })
        }
      }

      // Save video link to database immediately (if video was uploaded)
      if (videoLink) {
        try {
          await prisma.applications.update({
            where: { id: applicationId },
            data: {
              videolink: videoLink
            }
          })
          console.log(`Video link saved to database for application ${applicationId}`)
        } catch (dbError: any) {
          console.error('Error saving video link to database:', dbError.message)
          // Don't fail the request if video link save fails, continue with Kafka
        }
      }

      await producer.connect();
      await producer.send({
        topic: "application-submission",
        messages: [{
          value: JSON.stringify({ 
            applicationId: applicationId,
            resumeText: resumeText,
            messageHistory: messageHistory,
            videoLink: videoLink,
            userId:req.userId
          })
        }]
      });
//       const SystemPrompt = `You are an expert hiring manager evaluating a candidate's interview performance and resume for job suitability.

// EVALUATION TASK:
// Analyze the candidate's interview performance and resume to determine their suitability for the position.

// JOB DETAILS:
// - Position: ${application.job.title}
// - Description: ${application.job.description || 'Not provided'}
// - Required Skills: ${application.job.skills || 'Not specified'}
// - Experience Required: ${application.job.experiencerequired || 'Not specified'}
// - Education Level: ${application.job.educationlevel || 'Not specified'}
// - Requirements: ${application.job.requirements || 'Not specified'}

// CANDIDATE DATA:
// - Resume Content: ${resumeText}
// - Interview Conversation: ${messageHistory}

// EVALUATION CRITERIA:
// 1. Technical competency and relevant skills
// 2. Experience alignment with job requirements
// 3. Communication and problem-solving abilities
// 4. Cultural fit and soft skills
// 5. Overall qualification for the role

// OUTPUT FORMAT (JSON ONLY):
// {
//   "score": [number from 1-10, where 10 is excellent fit],
//   "reasoning": "[Detailed explanation of the score, highlighting strengths and weaknesses based on interview responses and resume]"
// }

// Provide a fair, objective assessment based on the candidate's demonstrated abilities during the interview and their background.`
//       const response = await client.responses.create({
//         model: "gpt-4o-mini",
//         input: [
//           { role: "system", content: SystemPrompt },
//           { role: "user", content: messageHistory },
//         ],
//       });
//       // Extract JSON from AI response (remove markdown code blocks if present)
//       let jsonText = response.output_text.trim()
      
//       // Remove markdown code blocks if present
//       if (jsonText.startsWith('```json')) {
//         jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
//       } else if (jsonText.startsWith('```')) {
//         jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
//       }
      
//       // Parse the cleaned JSON
//       let parsedResponse
//       try {
//         parsedResponse = JSON.parse(jsonText)
//       } catch (parseError) {
//         console.error("Failed to parse AI response as JSON:", jsonText)
//         console.error("Parse error:", parseError)
//         // Fallback: try to extract score and reasoning using regex
//         const scoreMatch = jsonText.match(/"score":\s*(\d+(?:\.\d+)?)/)
//         const reasoningMatch = jsonText.match(/"reasoning":\s*"([^"]+)"/)
        
//         parsedResponse = {
//           score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
//           reasoning: reasoningMatch ? reasoningMatch[1] : "Unable to parse reasoning"
//         }
//       }
      
//       const relevanceScore = parsedResponse.score
//       const relevanceComment = parsedResponse.reasoning
      
//       await prisma.applications.update({
//         where:{id:applicationId},
//         data:{
//           relevancescore:relevanceScore,
//           relevancecomment:relevanceComment
//         }
//       })
    //   return res.json({
    //     resume:response.output_text
    //   })
    return res.json({
      message:"Application is successfully queued for evaluation!"
    })
    })
  }catch(e:any){
    await logError('submitApplication',e.message)
    return res.status(500).json({ message: e.message });
  }
})