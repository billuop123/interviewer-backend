import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { sanitize } from "../utils/helperfunctions";
import { prisma } from "../utils/prismaClient";
import { logError } from "../utils/logger";
export const userRouter = Router();
const signupSchema = z.object({
  name: z.string().min(3, "Name must be atleast 3 characters"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[@$!%*?&#]/,
      "Password must contain at least one special character (@$!%*?&#)"
    ),
  phone: z.string().optional(),
  roleId: z.string("Role Id is missing").optional(),
  companyId: z.string().optional(),
});
userRouter.post("/signup", async (req, res) => {
  try {
    const body = req.body;
    let parsedBody = signupSchema.safeParse(body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: parsedBody.error.issues.map((x) => x.message),
      });
    }
    const { email, password, phone, roleId, companyId, name } = parsedBody.data;
    const existingUser = await prisma.users.findUnique({
      where: {
        email,
        deleted:null
      },
    });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const role=await prisma.roles.findUnique({
      where:{
        name:"USER",
      }
    })
    if(!role){
      return res.status(404).json({
        message: "User role not found",
      });
    }
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companyId: companyId ?? null,
        phone,
        roleId: role.id ,
      },
    });
    const result = sanitize(newUser);
    return res.status(200).json(result);
  } catch (e: any) {
    await logError('createUser',e.message)
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});
userRouter.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    const users = await prisma.users.findMany({
      where: {
        deleted: null,
      },
      take: limit,
      skip,
    });
    const result = sanitize(users);
    return res.status(200).json({
      result,
    });
  } catch (e:any) {
    await logError('getAllUser',e.message)
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
userRouter.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(404).json({
        message: "userid is missing!!",
      });
    }
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
        deleted: null,
      },
    });
    if (!user) {
      return res.status(400).json({
        message: "User with the following id is not found",
      });
    }
    const result = sanitize(user);
    return res.status(200).json({
      result,
    });
  } catch (e:any) {
    await logError('getUser',e.message)
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
userRouter.put("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, password, phone, roleId, companyId } = req.body;
    if (!userId) {
      return res.status(400).json({
        message: "User id is required",
      });
    }
    const existingUser=await prisma.users.findFirst({
        where:{
            email,
            id:{not :userId},
            deleted:null
        }
    })
    if(existingUser){
        return res.status(403).json({
            message:"Email is already in use!!"
        })
    }
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
        deleted: null,
      },
    });
    if (!user) {
      
      return res.status(404).json({
        message: "User with the following id is not found",
      });
    }
    const updatedData: any = {
      name,
      email,
      phone,
      roleId,
      companyId,
      updated: new Date(),
    };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }
    const updatedUser = await prisma.users.update({
      where: {
        id: userId,
      },
      data: updatedData,
    });
    const result = sanitize(updatedUser);
    return res.status(200).json({
      result,
    });
  } catch (e:any) {
    await logError('updateUser',e.message)
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});
userRouter.delete("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(404).json({
        message: "User id is not present",
      });
    }
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
        deleted:null
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "user is not found",
      });
    }
    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        deleted: new Date(),
      },
    });
    return res.status(200).json({
      message: "User deleted Successfully",
    });
  } catch (e:any) {
    await logError('updateUser',e.message)
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
