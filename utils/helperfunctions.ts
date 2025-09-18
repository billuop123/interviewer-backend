import {v2 as cloudinary} from 'cloudinary'
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
