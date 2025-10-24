import { Router } from "express"
import formidable from "formidable"
import { prisma } from "../utils/prismaClient"
import { sanitize, uploadResume } from "../utils/helperfunctions"
import { logError } from "../utils/logger"
export const userDetailsRouter=Router()
userDetailsRouter.post("/",async (req,res)=>{
    try{
        const form=formidable({multiples:false})
        form.parse(req,async(err:any,fields:any,files:any)=>{
                if(err){
                    return res.status(400).json({message:"Error parsing data"})
                }
                const cleanFields:Record<string,any>={};
                for (const[key,value] of Object.entries(fields)){
                    if(key==="skills"){
                        cleanFields[key]=value
                    }else{
                        cleanFields[key]=(Array.isArray(value)?value[0]:value)
                    }
                }
                const {
                    userId,
                    experience,
                    phone,
                    skills,
                    location,
                    bio,
                    linkedin,
                    portfolio,
                    github,
                    expected_salary,
                    availability,
                }=cleanFields
                if(!userId){
                    return res.status(400).json({
                        message:"user id is required"
                    })
                }
                const user=await prisma.users.findUnique({
                        where:{
                            id:userId,
                            deleted:null
                        }
                })
                if(!user){
                    return res.status(404).json({
                        message:"Invalid user id"
                    })
                }
                const existingDetails=await prisma.userdetails.findUnique({
                    where:{
                        userId:user.id,
                        deleted:null
                    }
                })
                
                let resumelink="";
                const resumeFile=Array.isArray(files.resume)?files.resume[0]:files.resume
                if(resumeFile && resumeFile.filepath){
                    resumelink=await uploadResume(resumeFile.filepath,`resume_${userId}`) as string
                }
                
                let details;
                // Check for phone number conflicts (for both create and update)
                if(phone){
                    const existingPhone=await prisma.userdetails.findUnique({
                        where:{
                            phone
                        }
                    })
                    // If phone exists and it's not the current user's phone
                    if(existingPhone && existingPhone.userId !== user.id){
                        return res.status(400).json({
                            message:"Phone number is already in use by another user"
                        })
                    }
                }

                if(existingDetails){
                    // Update existing user details
                    details = await prisma.userdetails.update({
                        where: {
                            id: existingDetails.id
                        },
                        data: {
                            experience: parseInt(experience),
                            phone,
                            resumelink: resumelink || existingDetails.resumelink, // Keep existing if no new file
                            skills, 
                            location,
                            bio,
                            linkedin,
                            portfolio,
                            github,
                            expected_salary : parseInt(expected_salary),
                            availability,
                        },
                    })
                } else {
                    // Create new user details
                    details = await prisma.userdetails.create({
                        data: {
                          userId: user.id,
                          experience: parseInt(experience),
                          phone,
                          resumelink,
                          skills, 
                          location,
                          bio,
                          linkedin,
                          portfolio,
                          github,
                          expected_salary : parseInt(expected_salary),
                          availability,
                        },
                    })
                };
                const result=sanitize(details)
                return res.status(200).json({
                    result
                })

        })
    }catch(e:any){
        await logError("createUserDetails",e.message)
        
        // Handle Prisma unique constraint errors
        if(e.code === 'P2002'){
            const field = e.meta?.target?.[0] || 'field'
            return res.status(400).json({
                message: `${field} is already in use`
            })
        }
        
        res.status(500).json({
            error:"Internal server error"
        })
    }
})

userDetailsRouter.get('/getuserdetails/:userId',async(req,res)=>{
    try{
        const userId=req.params.userId
        if(!userId){
            return res.status(404).json({
                message:"userId is not found"
            })
        }
        const user=await prisma.users.findUnique({
            where:{
                id:userId,
                deleted:null
            }
        })
        if(!user){
            return res.status(401).json({
                message:"user is not found"
            })
        }
        const details=await prisma.userdetails.findUnique({
            where:{
                userId
            }
        })
        if(!details){
            return res.status(404).json({
                message:"details for the user is not found"
            })
        }
        const result=sanitize(details)
        return res.status(200).json({
            result
        })
    }catch(e:any){
        await logError('getUserbyUserid',e.message)
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})
userDetailsRouter.post('/updateuserdetails/:userId',async (req,res)=>{
    try{
        const userId=req.params.userId
        const {  experience,
            phone,
            resumelink,
            skills,
            location,
            bio,
            linkedin,
            portfolio,
            github,
            expected_salary,
            availability}=req.body
        if(!userId){
            return res.status(404).json({
                message:'Id is required'
            })
        }
        const user=await prisma.users.findUnique({
            where:{
                id:userId
            }
        })
        if(!user){
            return res.status(404).json({
                message:"user is not found"
            })
        }
        const updated=await prisma.userdetails.update({
            where:{
                userId:user.id
            },data:{
                experience,
                phone,
                resumelink,
                skills,
                location,
                bio,
                linkedin,
                portfolio,
                github,
                expected_salary,
                availability,
                updated: new Date(),
            }
        })
        const result=sanitize(updated)
        res.status(200).json({
            result
        })
    }catch(e:any){
        await logError('updateUserDetails',e.message)
        res.status(500).json({
            message:"Internal server error"
        })
    }
})

userDetailsRouter.delete('/deleteuserdetail/:userId',async (req,res)=>{
    try{
        const userId=req.params.userId
        if(!userId){
            res.status(400).json({
                message:"userId is required"
            })
        }
        const user=await prisma.users.findUnique({
            where:{
                id:userId
            }
        })
        if(!user){
            res.status(404).json({
                message:"user not found"
            })
        }
        await prisma.userdetails.update({
            where:{
                userId
            },
            data:{
                deleted:new Date()
            }
        })
    res.status(200).json({
        message:"User details soft-deleted successfully"
    })
    }catch(e:any){  
        await logError('softDeleteUserDetails',e.message)
        return res.status(500).json({
            message:'Internal server error'
        })
    }
})
// // Upload resume endpoint
// userDetailsRouter.post('/upload-resume', async (req, res) => {
//     try {
//         console.log("Resume upload endpoint hit")
//         const form = formidable({ multiples: false })
//         form.parse(req, async (err: any, fields: any, files: any) => {
//             if (err) {
//                 console.error("Formidable error:", err)
//                 return res.status(400).json({ message: "Error parsing file" })
//             }
            
//             console.log("Files received:", files)
            
//             const resume = Array.isArray(files.resume) ? files.resume[0] : files.resume
//             if (!resume) {
//                 console.log("No resume file found")
//                 return res.status(400).json({ message: "No resume file provided" })
//             }
            
//             console.log("Resume file:", resume.originalFilename, resume.size)
            
//             try {
//                 const resumeUrl = await uploadResume(resume.filepath, `resume_${Date.now()}`) as string
//                 console.log("Resume uploaded successfully:", resumeUrl)
//                 return res.json({ resumeUrl })
//             } catch (uploadError: any) {
//                 console.error("Upload error:", uploadError)
//                 return res.status(500).json({ message: "Failed to upload resume" })
//             }
//         })
//     } catch (error: any) {
//         console.error("Resume upload endpoint error:", error)
//         await logError('uploadResume', error.message)
//         return res.status(500).json({ message: "Internal server error" })
//     }
// })
