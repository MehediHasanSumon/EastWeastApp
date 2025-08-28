import { Request, Response, Router } from "express";
import { getUserAccessToken, loginUser, registerNewUser, updateMyAvatar, updateMyProfile, userLogout } from "../app/controllers/Auth/auth.controller";
import { updateProfile, updateEmail, updatePassword, getProfile } from "../app/controllers/Auth/account.controller";
import { uploadAvatar } from "../middlewares/upload";
import { checkResetPasswordToken, confirmPassword, forgetPassword } from "../app/controllers/Auth/ResetPasswordController";
import { sendEmailVetificationToken, userEmailVetification } from "../app/controllers/Auth/verifyEmailController";
import { isLoggedIn } from "../app/middlewares/AuthMiddlewere";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const route = Router();

route.post("/register", registerNewUser);
route.post("/login", loginUser);
route.post("/forgot-password", forgetPassword);
route.get("/check-reset-password-token/:token", checkResetPasswordToken);
route.post("/confirm-password/:token", confirmPassword);

// Authenticational Routes
route.post("/refresh-token", isLoggedIn, getUserAccessToken);
route.get("/send-email-varification-code", isLoggedIn, sendEmailVetificationToken);
route.post("/varification-user-email", isLoggedIn, userEmailVetification);
route.get("/logout", isLoggedIn, userLogout);

route.get("/me", isLoggedIn, (req: Request, res: Response) => {
  res.status(200).send({
    status: true,
    message: "User is logged in",
    user: req.user,
  });
});

route.put('/me', isLoggedIn, updateMyProfile);
route.post('/me/avatar', isLoggedIn, uploadAvatar.single('avatar'), updateMyAvatar);

// Account management routes
route.get('/me/profile', isLoggedIn, getProfile);
route.put('/me/profile', isLoggedIn, updateProfile);
route.put('/me/email', isLoggedIn, updateEmail);
route.put('/me/password', isLoggedIn, updatePassword);

export default route;
