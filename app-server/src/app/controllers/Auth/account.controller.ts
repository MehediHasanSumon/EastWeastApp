import { Request, Response } from "express";
import { comparePasswords, hashPassword } from "../../../utils/password";
import { emailValidator } from "../../../utils/validate";
import User from "../../models/Users";

/**
 * Update user profile information
 * @route PUT /api/me
 */
export const updateProfile = async (req: Request, res: Response): Promise<Response | any> => {
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

    // Update name if provided
    if (name?.trim()) {
      user.name = name.trim();
    }

    // Update email if provided and different from current
    if (email?.trim() && email.trim() !== user.email) {
      const emailValidation = await emailValidator(email.trim());
      if (!emailValidation.valid) {
        return res.status(400).send({ 
          status: false, 
          message: emailValidation.message 
        });
      }

      const existingUser = await User.findOne({ email: email.trim() });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(400).send({ 
          status: false, 
          message: 'Email already in use by another user.' 
        });
      }
      user.email = email.trim();
    }

    // Update other fields if provided
    if (typeof phone === 'string') {
      user.phone = phone.trim();
    }
    
    if (typeof address === 'string') {
      user.address = address.trim();
    }
    
    if (typeof bio === 'string') {
      user.bio = bio.trim();
    }
    
    if (typeof profession === 'string') {
      user.profession = profession.trim();
    }
    
    if (date_of_birth) {
      const date = new Date(date_of_birth);
      if (!isNaN(date.getTime())) {
        user.date_of_birth = date;
      } else {
        return res.status(400).send({ 
          status: false, 
          message: 'Invalid date format. Please provide a valid ISO date string.' 
        });
      }
    }

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('roles');

    return res.status(200).send({ 
      status: true, 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).send({ 
      status: false, 
      message: 'HTTP 500 Internal Server Error' 
    });
  }
};

/**
 * Update user email address
 * @route PUT /api/me/email
 */
export const updateEmail = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).send({ status: false, message: 'Unauthorized' });
    }

    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).send({ 
        status: false, 
        message: 'Email is required.' 
      });
    }

    // Validate email format
    const emailValidation = await emailValidator(email.trim());
    if (!emailValidation.valid) {
      return res.status(400).send({ 
        status: false, 
        message: emailValidation.message 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ status: false, message: 'User not found.' });
    }

    // Check if email is already in use by another user
    const existingUser = await User.findOne({ email: email.trim() });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).send({ 
        status: false, 
        message: 'Email already in use by another user.' 
      });
    }

    // Check if email is the same as current
    if (email.trim() === user.email) {
      return res.status(400).send({ 
        status: false, 
        message: 'New email must be different from current email.' 
      });
    }

    // Update email
    user.email = email.trim();
    // Reset email verification since email changed
    user.verify_at = null;
    
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('roles');

    return res.status(200).send({ 
      status: true, 
      message: 'Email updated successfully. Please verify your new email address.',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating email:', error);
    return res.status(500).send({ 
      status: false, 
      message: 'HTTP 500 Internal Server Error' 
    });
  }
};

/**
 * Update user password
 * @route PUT /api/me/password
 */
export const updatePassword = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).send({ status: false, message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword?.trim()) {
      return res.status(400).send({ 
        status: false, 
        message: 'Current password is required.' 
      });
    }

    if (!newPassword?.trim()) {
      return res.status(400).send({ 
        status: false, 
        message: 'New password is required.' 
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).send({ 
        status: false, 
        message: 'New password must be at least 8 characters long.' 
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).send({ 
        status: false, 
        message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number.' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ status: false, message: 'User not found.' });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).send({ 
        status: false, 
        message: 'Current password is incorrect.' 
      });
    }

    // Check if new password is different from current
    const isNewPasswordSame = await comparePasswords(newPassword, user.password);
    if (isNewPasswordSame) {
      return res.status(400).send({ 
        status: false, 
        message: 'New password must be different from current password.' 
      });
    }

    // Hash and update new password
    const hashedNewPassword = await hashPassword(newPassword);
    user.password = hashedNewPassword;
    
    await user.save();

    return res.status(200).send({ 
      status: true, 
      message: 'Password updated successfully.' 
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).send({ 
      status: false, 
      message: 'HTTP 500 Internal Server Error' 
    });
  }
};

/**
 * Get user profile information
 * @route GET /api/me/profile
 */
export const getProfile = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) {
      return res.status(401).send({ status: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId)
      .select('-password')
      .populate('roles');

    if (!user) {
      return res.status(404).send({ status: false, message: 'User not found.' });
    }

    return res.status(200).send({ 
      status: true, 
      user 
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).send({ 
      status: false, 
      message: 'HTTP 500 Internal Server Error' 
    });
  }
};
