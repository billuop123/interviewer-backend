import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";
import { OpenAI } from "openai";

const kafka = new Kafka({
  clientId: "interviewer-service",
  brokers: ["localhost:9092"]
})

const consumer = kafka.consumer({ groupId: "interview-processor" });
const prisma = new PrismaClient();
const openai = new OpenAI();

async function processInterviewWithAI(data: any) {
  const { resumeText, messageHistory, applicationId } = data;
  
  // Get application details
  const application = await prisma.applications.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          title: true,
          description: true,
          skills: true,
          requirements: true,
          experiencerequired: true,
          educationlevel: true
        }
      }
    }
  });

  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
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

Provide a fair, objective assessment based on the candidate's demonstrated abilities during the interview and their background.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SystemPrompt },
      { role: "user", content: messageHistory }
    ]
  });

  // Parse AI response
  let jsonText = response.choices[0].message.content?.trim() || "";
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Parse the cleaned JSON with error handling
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(jsonText);
  } catch (parseError) {
    console.error("Failed to parse AI response as JSON:", jsonText);
    console.error("Parse error:", parseError);
    
    // Fallback: try to extract score and reasoning using regex
    const scoreMatch = jsonText.match(/"score":\s*(\d+(?:\.\d+)?)/);
    // More flexible reasoning match to handle escaped quotes and multiline text
    const reasoningMatch = jsonText.match(/"reasoning":\s*"((?:[^"\\]|\\.)*)"/);
    
    parsedResponse = {
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      reasoning: reasoningMatch ? reasoningMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : "Unable to parse reasoning from AI response"
    };

  }
  return {
    score: parsedResponse.score,
    reasoning: parsedResponse.reasoning
  };
}

async function main() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "application-submission",
    fromBeginning: true
  });


  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      let data: any = null;
      
      try {
        data = JSON.parse(message.value?.toString() || "{}");

        
        // Process interview with AI
        const aiResponse = await processInterviewWithAI(data);
        
        // Validate the response before saving
        if (typeof aiResponse.score !== 'number' || aiResponse.score < 0 || aiResponse.score > 10) {
          console.warn(`⚠️ Invalid score received: ${aiResponse.score}, using default`);
          aiResponse.score = 0;
        }
        
        if (!aiResponse.reasoning || typeof aiResponse.reasoning !== 'string') {
          console.warn(`⚠️ Invalid reasoning received, using default`);
          aiResponse.reasoning = "Unable to generate proper assessment";
        }
        
        // Save results to database
        await prisma.applications.update({
          where: { id: data.applicationId },
          data: {
            relevancescore: aiResponse.score,
            relevancecomment: aiResponse.reasoning,
          }
        });
        
        await notifyUser(data.applicationId, data.userId);
        
      } catch (error) {
        console.error("❌ Error processing interview:", error);
        
        // Try to save error state to database if we have the data
        if (data && data.applicationId) {
          try {
            await prisma.applications.update({
              where: { id: data.applicationId },
              data: {
                relevancescore: 0,
                relevancecomment: "Error occurred during processing. Please contact support.",
              }
            });
          } catch (dbError) {
            console.error("❌ Failed to save error state:", dbError);
          }
        }
        
        // TODO: Implement retry logic or dead letter queue
      }
    },
  });
}
const WEBSOCKET_URL=`ws://localhost:2000`
async function notifyUser(applicationId:string,userId:string){
  try {
    const socket=new WebSocket(WEBSOCKET_URL)
    
    socket.onopen=()=>{
      socket.send(JSON.stringify({
        event:'notify',
        applicationId:applicationId,
        userId:userId,
      }))
      socket.close()
    }
    
    socket.onerror=(error)=>{
      console.error("WebSocket notification error:", error)
    }
    
    // Close connection after 5 seconds if not already closed
    setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }, 5000)
    
  } catch (error) {
    console.error("Failed to send WebSocket notification:", error)
  }
}
main().catch(console.error);