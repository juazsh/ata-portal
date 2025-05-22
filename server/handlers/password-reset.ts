import { Request, Response } from "express";
import { User } from "../lib/mongodb";
import { PasswordReset } from "../models/password-reset";
import { sendMail } from "../services/email";
import { getPasswordResetEmailTemplate } from "../utils/password-reset-email-template";
import bcrypt from "bcrypt";

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export const createPasswordResetRequest = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message: "If your email is registered, you will receive a password reset code shortly"
      });
    }


    const code = generateVerificationCode();


    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    await PasswordReset.deleteMany({ email });


    const passwordReset = new PasswordReset({
      email,
      code,
      expiresAt
    });

    await passwordReset.save();


    const emailHtml = getPasswordResetEmailTemplate({
      firstName: user.firstName,
      lastName: user.lastName,
      code,
      email: email
    });

    await sendMail({
      to: email,
      subject: 'STEM Masters - Password Reset Code',
      html: emailHtml
    });

    return res.status(200).json({
      message: "If your email is registered, you will receive a password reset code shortly"
    });

  } catch (error) {
    console.error("Error creating password reset request:", error);
    return res.status(500).json({
      message: "Failed to process password reset request",
      error: (error as Error).message
    });
  }
};


export const verifyPasswordResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }


    const resetRequest = await PasswordReset.findOne({
      email,
      code,
      isVerified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }


    resetRequest.isVerified = true;
    await resetRequest.save();

    return res.status(200).json({
      message: "Code verified successfully",
      resetId: resetRequest._id
    });

  } catch (error) {
    console.error("Error verifying password reset code:", error);
    return res.status(500).json({
      message: "Failed to verify code",
      error: (error as Error).message
    });
  }
};


export const verifyPasswordResetLink = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.query;

    if (!email || !code) {
      return res.status(400).send("Email and code are required parameters");
    }


    const resetRequest = await PasswordReset.findOne({
      email: email.toString(),
      code: code.toString(),
      isVerified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).send("Invalid or expired code. Please request a new password reset.");
    }


    resetRequest.isVerified = true;
    await resetRequest.save();


    return res.redirect(`/reset-password?resetId=${resetRequest._id}&email=${encodeURIComponent(email.toString())}`);

  } catch (error) {
    console.error("Error verifying password reset link:", error);
    return res.status(500).send("An error occurred while verifying your reset code. Please try again.");
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetId, email, newPassword } = req.body;

    if (!resetId || !email || !newPassword) {
      return res.status(400).json({ message: "Reset ID, email, and new password are required" });
    }
    const resetRequest = await PasswordReset.findOne({
      _id: resetId,
      email,
      isVerified: true,
      expiresAt: { $gt: new Date() }
    });
    if (!resetRequest) {
      return res.status(400).json({ message: "Invalid or expired reset request" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();
    await PasswordReset.deleteOne({ _id: resetId });
    return res.status(200).json({
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      message: "Failed to reset password",
      error: (error as Error).message
    });
  }
};