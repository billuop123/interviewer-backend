import {v2 as cloudinary} from 'cloudinary'
import OpenAI from "openai";
export function sanitize<T extends Record<string,any>>(data:T | T[]){
    const sanitizeObject=(obj:T)=>{
        const result:Partial<T>={}
        for (const key in obj){
            const isSensitive=key==="password" || key==='deleted'
            if(!isSensitive){
                result[key]=obj[key]
            }
        }
        return result
    }
    return Array.isArray(data)?data.map(sanitizeObject):sanitizeObject(data)
}
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
export async  function uploadResume(localFilePath:string,publicId?:string){
    try{
    const result = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "raw",
        folder: "resumes",
        publicId,
      });
      return result.secure_url;
    }catch(e:any){
        console.error("Cloudinary upload error",e.message)
    }
}
export async  function uploadVideos(localFilePath:string,publicId?:string){
    try{
    const result = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "video",
        folder: "videos",
        publicId,
        chunk_size: 6000000, // 6MB chunks for better video uploads
        eager: [
          { width: 300, height: 300, crop: "pad", audio_codec: "none" },
          { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" }
        ],
        eager_async: true
      });
      return result.secure_url;
    }catch(e:any){
        console.error("Cloudinary upload error",e.message)
        throw new Error(`Video upload failed: ${e.message}`)
    }
}


export async function runOpenAiPrompt(prompt:any,resumeText:string,application:any){
    console.log(prompt)
    const client = new OpenAI   ();
    const SystemPrompt = `You are a professional AI interviewer conducting a technical interview for a hiring company.
  
  CONTEXT:
  - Position: ${application.job.title}
  - Company: ${application.job.companyid ? `Company ID: ${application.job.companyid}` : 'Not specified'}
  - Job Description: ${application.job.description || 'Not provided'}
  - Location: ${application.job.location || 'Not specified'}
  - Remote: ${application.job.isremote ? 'Yes' : 'No'}
  - Salary Range: ${application.job.salarymin && application.job.salarymax ? `${application.job.salarymin} - ${application.job.salarymax} ${application.job.salarycurrency || ''}` : 'Not specified'}
  - Required Experience: ${application.job.experiencerequired || 'Not specified'}
  - Education Level: ${application.job.educationlevel || 'Not specified'}
  - Required Skills: ${application.job.skills || 'Not specified'}
  - Requirements: ${application.job.requirements || 'Not specified'}
  
  CANDIDATE INFORMATION:
  - Resume Content: ${resumeText}
  - Cover Letter: ${application.coverletter || 'Not provided'}
  - Additional Notes: ${application.notes || 'None'}
  
  INTERVIEW GUIDELINES:
  1. Conduct a professional, comprehensive interview with 10-15 technical questions and 2-3 personal/behavioral questions
  2. Ask ONE question at a time and wait for the candidate's response
  3. Provide brief, constructive feedback on answers before proceeding to the next question
  4. Focus questions on relevant skills, experience, and job requirements
  5. Keep responses concise and professional (2-3 sentences max)
  6. Do NOT number your questions or mention how many questions remain
  7. Adapt questions based on the candidate's background and the job requirements
  8. When you've asked sufficient questions (typically after 12-18 exchanges), respond with: "The interview is complete. You can now press the 'End Interview' button to finish."
  9. If the candidate continues talking after interview completion, politely remind them to end the interview
  
  Remember: Be professional, encouraging, and focused on evaluating the candidate's fit for the specific role.`
    const response = await client.responses.create({
          model: "gpt-4o-mini",
          input: [
            {
              role: "system",
              content:SystemPrompt
            },
            ...prompt.map((m:any) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        });
      return response.output_text
  }
  
 export  async function streamOpenAiResponse(prompt: any, resumeText: string, application: any, res: any) {
    const client = new OpenAI();
  
    const SystemPrompt = `You are a professional AI interviewer conducting a technical interview for a hiring company.
  
  CONTEXT:
  - Position: ${application.job.title}
  - Company: ${application.job.companyid ? `Company ID: ${application.job.companyid}` : 'Not specified'}
  - Job Description: ${application.job.description || 'Not provided'}
  - Location: ${application.job.location || 'Not specified'}
  - Remote: ${application.job.isremote ? 'Yes' : 'No'}
  - Salary Range: ${application.job.salarymin && application.job.salarymax ? `${application.job.salarymin} - ${application.job.salarymax} ${application.job.salarycurrency || ''}` : 'Not specified'}
  - Required Experience: ${application.job.experiencerequired || 'Not specified'}
  - Education Level: ${application.job.educationlevel || 'Not specified'}
  - Required Skills: ${application.job.skills || 'Not specified'}
  - Requirements: ${application.job.requirements || 'Not specified'}
  
  CANDIDATE INFORMATION:
  - Resume Content: ${resumeText}
  - Cover Letter: ${application.coverletter || 'Not provided'}
  - Additional Notes: ${application.notes || 'None'}
  
  INTERVIEW GUIDELINES:
  1. Conduct a professional, comprehensive interview with 10-15 technical questions and 2-3 personal/behavioral questions
  2. Ask ONE question at a time and wait for the candidate's response
  3. Provide brief, constructive feedback on answers before proceeding to the next question
  4. Focus questions on relevant skills, experience, and job requirements
  5. Keep responses concise and professional (2-3 sentences max)
  6. Do NOT number your questions or mention how many questions remain
  7. Adapt questions based on the candidate's background and the job requirements
  8. When you've asked sufficient questions (typically after 12-18 exchanges), respond with: "The interview is complete. You can now press the 'End Interview' button to finish."
  9. If the candidate continues talking after interview completion, politely remind them to end the interview
  
  Remember: Be professional, encouraging, and focused on evaluating the candidate's fit for the specific role.`;
  
    try {
      const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        messages: [
          {
            role: "system",
            content: SystemPrompt,
          },
          ...prompt.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      });
  
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content, isComplete: false })}\n\n`);
        }
      }
  
      res.write(`data: ${JSON.stringify({ isComplete: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Streaming error:", error);
      res.write(`data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`);
      res.end();
    }
  }