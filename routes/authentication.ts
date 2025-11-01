import {Router} from "express"
import axios from "axios"
import {z} from "zod"
import { prisma } from "../utils/prismaClient"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sanitize } from "../utils/helperfunctions"
import { logError } from "../utils/logger"
export const router=Router()
const signinInputs=z.object({
    email:z.email(),
    password:z.string()
})
router.post('/signin',async (req,res)=>{
    try{
        const body=req.body
        const parsedBody=signinInputs.safeParse(body)
        if(!parsedBody.success){
            return res.status(400).json({
                message:"Invalid inputs detected"
            })
        }
        const {password,email}=parsedBody.data
        const user=await prisma.users.findUnique({
            where:{
                email,
                deleted:null
            },include:{
                role:{
                    select:{id:true,name:true,code:true}
                },
                company:{
                    select:{id:true,name:true}
                }
            }
        })
        if(!user || user.deleted){
            return res.status(401).json({
                message:"Invalid credentials"
            })
        }
        const isPasswordvalid=await bcrypt.compare(password,user.password)
        if(!isPasswordvalid){
            return res.status(401).json({
                message:"Invalid credentials"
            })
        }
        const token=jwt.sign({
            userId:user.id,
            email:user.email,
            role:user.role?.code,
            companyId:user.companyId || null
        },process.env.JWT_SECRET!,{
            expiresIn:'7d'
        })
        const result=sanitize(user)
        return res.status(201).json({
            token,
            result
        })
    }catch(e:any){
        await logError('login',e.message)
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})

router.get('/google', async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID
        const port = process.env.PORT ?? '3000'
        const host = (req.get('host') ?? `localhost:${port}`).replace(/\/$/, '')
        const scheme = req.protocol || 'http'
        const defaultRedirect = `${scheme}://${host}/api/v1/auth/google/callback`
        const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? defaultRedirect
        if (!clientId) {
            return res.status(500).json({ message: 'Google client id not configured' })
        }

        const scope = encodeURIComponent(['openid', 'email', 'profile'].join(' '))
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
        return res.redirect(authUrl)
    } catch (e: any) {
        await logError('googleAuthStart', e.message)
        return res.status(500).json({ message: 'Failed to initiate Google OAuth' })
    }
})

router.get('/google/callback', async (req, res) => {
    try {
        const code = req.query.code as string | undefined
        if (!code) {
            return res.status(400).json({ message: 'Missing authorization code' })
        }

        const clientId = process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET
        const port = process.env.PORT ?? '3000'
        const host = (req.get('host') ?? `localhost:${port}`).replace(/\/$/, '')
        const scheme = req.protocol || 'http'
        const defaultRedirect = `${scheme}://${host}/api/v1/auth/google/callback`
        const envRedirect = process.env.GOOGLE_REDIRECT_URI ?? defaultRedirect
        const requestOrigin = (req.headers.origin as string | undefined) ?? ''
        const computedFrontend = requestOrigin ? `${requestOrigin.replace(/\/$/, '')}/oauth-callback` : 'http://localhost:3001/oauth-callback'
        const frontendRedirect = process.env.GOOGLE_FRONTEND_REDIRECT ?? computedFrontend

        if (!clientId || !clientSecret) {
            return res.status(500).json({ message: 'Google OAuth not configured' })
        }
        // Exchange code for tokens
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: envRedirect,
                grant_type: 'authorization_code'
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )

        const { id_token: idToken } = tokenResponse.data as { id_token: string }
        if (!idToken) {
            return res.status(400).json({ message: 'No id_token returned by Google' })
        }

        // Verify id token using tokeninfo endpoint (avoids extra libs)
        const infoResp = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { id_token: idToken } })
        const info = infoResp.data as any

        if (info.aud !== clientId) {
            return res.status(401).json({ message: 'Invalid Google token audience' })
        }
        if (info.email_verified !== 'true') {
            return res.status(401).json({ message: 'Google email not verified' })
        }

        const email = info.email as string
        const name = (info.name as string) || (info.given_name as string) || 'User'

        // Find or create user
        let user = await prisma.users.findUnique({
            where: { email, deleted: null },
            include: {
                role: { select: { id: true, name: true, code: true } },
                company: { select: { id: true, name: true } }
            }
        })

        if (!user) {
            // Get USER role
            const role = await prisma.roles.findUnique({ where: { name: 'USER' } })
            if (!role) {
                return res.status(500).json({ message: 'Default role USER not found' })
            }
            const randomPassword = await bcrypt.hash(`${info.sub}.${Date.now()}`, 10)
            user = await prisma.users.create({
                data: {
                    name,
                    email,
                    password: randomPassword,
                    roleId: role.id,
                    companyId: null,
                },
                include: {
                    role: { select: { id: true, name: true, code: true } },
                    company: { select: { id: true, name: true } }
                }
            })
        }

        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role?.code,
            companyId: user.companyId || null
        }, process.env.JWT_SECRET!, { expiresIn: '7d' })

        // Redirect back to frontend carrying the JWT as a URL fragment
        const redirectUrl = `${frontendRedirect}?token=${encodeURIComponent(token)}`
        return res.redirect(redirectUrl)
    } catch (e: any) {
        const googleError = (e?.response?.data) ? JSON.stringify(e.response.data) : e?.message
        console.error('Google OAuth callback error:', googleError)
        await logError('googleAuthCallback', googleError || 'unknown error')
        return res.status(500).json({ message: 'Failed to complete Google OAuth', detail: googleError })
    }
})