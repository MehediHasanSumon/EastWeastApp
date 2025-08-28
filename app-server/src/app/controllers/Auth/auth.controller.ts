import { Request, Response } from "express";

import { Types } from "mongoose";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../../utils/jwt";
import { storeRefreshToken } from "../../../utils/models";
import { comparePasswords, hashPassword } from "../../../utils/password";
import { emailValidator, nameValidator, passwordValidator } from "../../../utils/validate";
import { Permission } from "../../models/Permission"; // Make sure this import exists
import { Role } from "../../models/Role";
import User from "../../models/Users";
import UserToken from "../../models/UserToken";

export const registerNewUser = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { name, email, password, confirm_password, deviceId } = req.body;

    const nameValidation = nameValidator(name);
    if (!nameValidation.valid) {
      return res.status(400).send({
        status: false,
        message: nameValidation.message,
      });
    }

    const emailValidation = await emailValidator(email);
    if (!emailValidation.valid) {
      return res.status(400).send({
        status: false,
        message: emailValidation.message,
      });
    }

    const passwordValidation = passwordValidator(password, confirm_password);
    if (!passwordValidation.valid) {
      return res.status(400).send({
        status: false,
        message: passwordValidation.message,
      });
    }

    const hashedPassword = await hashPassword(password);

    let userRole = await Role.findOne({ name: "user" });
    if (!userRole) {
      userRole = await Role.create({ name: "user", permissions: [] });
    }

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      roles: [userRole._id],
    });

    const { accessToken, accessTokenExpiresIn } = await generateAccessToken(newUser as any);
    const { refreshToken, refreshTokenExpiresIn } = await generateRefreshToken(newUser as any);

    const isStored = await storeRefreshToken(newUser._id as string, refreshToken as string, deviceId as string, req);
    if (!isStored) {
      return res.status(500).send({
        status: false,
        message: "Failed to store refresh token",
      });
    }

    const user = await User.findById(newUser._id).select("-password");

    const userRoles = await Role.find({ _id: { $in: user?.roles } });
    const rolePermissionIds = userRoles.flatMap((role) => (role.permissions as Types.ObjectId[]) || []);
    const permissions = await Permission.find({ _id: { $in: rolePermissionIds } });

    const userDetails = {
      _id: user?._id,
      name: user?.name,
      email: user?.email,
      roles: userRoles,
      permissions: permissions,
      verifyAt: user?.verify_at,
    };

    return res.status(201).send({
      status: true,
      user: userDetails,
      token: {
        accessToken,
        accessTokenExpiresIn,
        refreshToken,
        refreshTokenExpiresIn,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Email is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({
        status: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!password) {
      return res.status(400).send({
        status: false,
        message: "Password is required.",
      });
    }

    const user = await User.findOne({ email });

    if (user === null) {
      return res.status(401).send({
        status: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        status: false,
        message: "Invalid email or password.",
      });
    }

    const { accessToken, accessTokenExpiresIn } = await generateAccessToken(user as any);
    const { refreshToken, refreshTokenExpiresIn } = await generateRefreshToken(user as any);

    const isStored = await storeRefreshToken(user._id as string, refreshToken as string, deviceId as string, req);
    if (!isStored) {
      return res.status(500).send({
        status: false,
        message: "Failed to store refresh token",
      });
    }

    const userRoles = await Role.find({ _id: { $in: user.roles } });
    const rolePermissionIds = userRoles.flatMap((role) => (role.permissions as Types.ObjectId[]) || []);
    const permissions = await Permission.find({ _id: { $in: rolePermissionIds } });

    const userDetails = {
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: userRoles,
      permissions: permissions,
      verifyAt: user.verify_at,
    };

    return res.status(201).send({
      status: true,
      user: userDetails,
      token: {
        accessToken,
        accessTokenExpiresIn,
        refreshToken,
        refreshTokenExpiresIn,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getUserAccessToken = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { deviceId } = req.body;

    const refreshToken = req.headers["x-refresh-token"];
    const existingAccessToken = req.headers["authorization"];

    if (!refreshToken) {
      return res.status(400).send({
        status: false,
        message: "Refresh token is required.",
      });
    }

    const isExist = await UserToken.findOne({ refreshToken: refreshToken as string });
    const userId = await verifyRefreshToken(refreshToken as string);
    const user = await User.findOne({ _id: userId.id }).select("-password");

    if (!isExist || !user) {
      return res.status(401).send({
        status: false,
        message: "Invalid refresh token.",
      });
    }

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found.",
      });
    }

    await UserToken.updateOne({ refreshToken: refreshToken }, { $set: { deviceId: deviceId || null } });

    let accessToken = existingAccessToken;
    let accessTokenExpiresIn: number | undefined;

    if (!existingAccessToken) {
      const newTokens = await generateAccessToken(user as any);
      accessToken = newTokens.accessToken;
      accessTokenExpiresIn = newTokens.accessTokenExpiresIn;
    }

    const userRoles = await Role.find({ _id: { $in: user.roles } });
    const rolePermissionIds = userRoles.flatMap((role) => (role.permissions as Types.ObjectId[]) || []);
    const permissions = await Permission.find({ _id: { $in: rolePermissionIds } });

    const userDetails = {
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: userRoles,
      permissions: permissions,
      verifyAt: user.verify_at,
    };

    return res.status(200).json({
      status: true,
      user: userDetails,
      token: existingAccessToken ? null : { accessToken, accessTokenExpiresIn },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const userLogout = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const refreshToken = req.headers["x-refresh-token"];

    if (!refreshToken) {
      return res.status(400).send({
        status: false,
        message: "Refresh token is required.",
      });
    }

    const getRefreshTokenFromDatabase = await UserToken.findOne({
      refreshToken: refreshToken as string,
    });

    if (!getRefreshTokenFromDatabase) {
      return res.status(401).send({
        status: false,
        message: "Invalid refresh token.",
      });
    }

    await getRefreshTokenFromDatabase.deleteOne();

    return res.status(200).json({
      status: true,
      message: "success",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).send({ status: false, message: 'Unauthorized' });
    }

    const {
      name,
      email,
      phone,
      address,
      bio,
      profession,
      date_of_birth, // expect ISO string
    } = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ status: false, message: 'User not found.' });
    }

    if (name?.trim()) user.name = name.trim();
    if (email?.trim() && email.trim() !== user.email) {
      const exists = await User.findOne({ email: email.trim() });
      if (exists) {
        return res.status(400).send({ status: false, message: 'Email already in use.' });
      }
      user.email = email.trim();
    }
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof address === 'string') user.address = address.trim();
    if (typeof bio === 'string') user.bio = bio.trim();
    if (typeof profession === 'string') user.profession = profession.trim();
    if (date_of_birth) {
      const d = new Date(date_of_birth);
      if (!isNaN(d.getTime())) user.date_of_birth = d;
    }

    await user.save();
    const safeUser = await User.findById(userId).select('-password').populate('roles');

    return res.status(200).send({ status: true, user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: false, message: 'HTTP 500 Internal Server Error' });
  }
};

export const updateMyAvatar = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).send({ status: false, message: 'Unauthorized' });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).send({ status: false, message: 'No file uploaded' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ status: false, message: 'User not found.' });
    }

    // Remove old file if exists
    if (user.profile_picture) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const uploadsRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
        
        // Extract filename from the stored path (e.g., "/uploads/avatars/filename.jpg" -> "filename.jpg")
        const oldFilename = user.profile_picture.split('/').pop();
        if (oldFilename) {
          const oldPath = path.join(uploadsRoot, 'avatars', oldFilename);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log(`Deleted old profile picture: ${oldPath}`);
          }
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue with upload even if deletion fails
      }
    }

    user.profile_picture = `/uploads/avatars/${file.filename}`;
    await user.save();

    const safeUser = await User.findById(userId).select('-password').populate('roles');
    return res.status(200).send({ status: true, user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: false, message: 'HTTP 500 Internal Server Error' });
  }
};