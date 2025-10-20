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

