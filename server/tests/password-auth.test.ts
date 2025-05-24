import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User, { UserRole } from '../models/user';
import { PasswordReset } from '../models/password-reset';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/password-utils';
import { 
  createPasswordResetRequest, 
  verifyPasswordResetCode, 
  resetPassword 
} from '../handlers/password-reset';
import { Request, Response } from 'express';

jest.mock('../services/email', () => ({
  sendMail: jest.fn().mockResolvedValue(true)
}));


jest.mock('../utils/password-reset-email-template', () => ({
  getPasswordResetEmailTemplate: jest.fn().mockReturnValue('<html>Mock Email</html>')
}));


const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/stem-masters-test';

describe('Password Authentication System', () => {
  let testUser: any;
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';
  const newPassword = 'NewPassword456!';

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    
    await User.deleteMany({});
    await PasswordReset.deleteMany({});
  });

  describe('Password Utilities', () => {
    it('should hash password correctly', async () => {
      const hashedPassword = await hashPassword(testPassword);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword.length).toBe(60);
      expect(hashedPassword.startsWith('$2')).toBe(true);
    });

    it('should compare passwords correctly', async () => {
      const hashedPassword = await hashPassword(testPassword);
      
      const isValid = await comparePassword(testPassword, hashedPassword);
      const isInvalid = await comparePassword('wrongpassword', hashedPassword);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should detect hashed passwords', () => {
      const plainPassword = 'password123';
      const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12';
      
      expect(isPasswordHashed(plainPassword)).toBe(false);
      expect(isPasswordHashed(hashedPassword)).toBe(true);
    });
  });

  describe('User Registration', () => {
    it('should create user with properly hashed password', async () => {
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
        role: UserRole.PARENT
      });

      await user.save();

      // Password should be hashed
      expect(user.password).not.toBe(testPassword);
      expect(user.password.length).toBe(60);
      expect(user.password.startsWith('$2')).toBe(true);

      // Should be able to compare correctly
      const isValid = await user.comparePassword(testPassword);
      expect(isValid).toBe(true);
    });

    it('should not double-hash already hashed passwords', async () => {
      const preHashedPassword = await hashPassword(testPassword);
      
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: preHashedPassword,
        role: UserRole.PARENT
      });

      await user.save();

      // Password should remain the same (not double-hashed)
      expect(user.password).toBe(preHashedPassword);
      
      // Should still be able to compare correctly
      const isValid = await user.comparePassword(testPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
        role: UserRole.PARENT,
        active: true
      });
      await testUser.save();
    });

    it('should authenticate with correct password', async () => {
      const user = await User.findOne({ email: testEmail });
      expect(user).toBeTruthy();
      
      const isValid = await user!.comparePassword(testPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await User.findOne({ email: testEmail });
      expect(user).toBeTruthy();
      
      const isValid = await user!.comparePassword('wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
        role: UserRole.PARENT,
        active: true
      });
      await testUser.save();
    });

    it('should create password reset request', async () => {
      const req = {
        body: { email: testEmail }
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      await createPasswordResetRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resetRecord = await PasswordReset.findOne({ email: testEmail });
      expect(resetRecord).toBeTruthy();
      expect(resetRecord!.code).toHaveLength(6);
      expect(resetRecord!.isVerified).toBe(false);
    });

    it('should verify password reset code', async () => {
      const resetRecord = new PasswordReset({
        email: testEmail,
        code: '123456',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      });
      await resetRecord.save();

      const req = {
        body: { email: testEmail, code: '123456' }
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      await verifyPasswordResetCode(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedRecord = await PasswordReset.findOne({ email: testEmail });
      expect(updatedRecord!.isVerified).toBe(true);
    });

    it('should complete password reset successfully', async () => {
      const resetRecord = new PasswordReset({
        email: testEmail,
        code: '123456',
        isVerified: true,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      });
      await resetRecord.save();

      const req = {
        body: { 
          resetId: resetRecord._id,
          email: testEmail,
          newPassword: newPassword
        }
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Check if password was updated
      const updatedUser = await User.findOne({ email: testEmail });
      expect(updatedUser).toBeTruthy();
      
      const oldPasswordValid = await updatedUser!.comparePassword(testPassword);
      expect(oldPasswordValid).toBe(false);
      
      const newPasswordValid = await updatedUser!.comparePassword(newPassword);
      expect(newPasswordValid).toBe(true);
      
      const deletedRecord = await PasswordReset.findById(resetRecord._id);
      expect(deletedRecord).toBeNull();
    });
  });

  describe('Password Update Scenarios', () => {
    beforeEach(async () => {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
        role: UserRole.PARENT,
        active: true
      });
      await testUser.save();
    });

    it('should handle direct password update on existing user', async () => {
      const user = await User.findOne({ email: testEmail });
      expect(user).toBeTruthy();
      
      user!.password = newPassword;
      await user!.save();
      
      const oldPasswordValid = await user!.comparePassword(testPassword);
      expect(oldPasswordValid).toBe(false);
      
      // New password should work
      const newPasswordValid = await user!.comparePassword(newPassword);
      expect(newPasswordValid).toBe(true);
    });

    it('should prevent double hashing on password update', async () => {
      const user = await User.findOne({ email: testEmail });
      expect(user).toBeTruthy();
      
      const originalHash = user!.password;
      
      user!.password = originalHash;
      await user!.save();
      
      expect(user!.password).toBe(originalHash);
      
      const isValid = await user!.comparePassword(testPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty password gracefully', async () => {
      try {
        const user = new User({
          firstName: 'Test',
          lastName: 'User',
          email: testEmail,
          password: '',
          role: UserRole.PARENT
        });
        await user.save();
        
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.errors.password).toBeDefined();
      }
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(200);
      
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: longPassword,
        role: UserRole.PARENT
      });
      
      await user.save();
      
      const isValid = await user.comparePassword(longPassword);
      expect(isValid).toBe(true);
    });

    it('should handle special characters in passwords', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: specialPassword,
        role: UserRole.PARENT
      });
      
      await user.save();
      
      const isValid = await user.comparePassword(specialPassword);
      expect(isValid).toBe(true);
    });
  });
});

// >> Integration test for full auth flow
describe('Full Authentication Integration', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await PasswordReset.deleteMany({});
  });

  it('should complete full password reset and login flow', async () => {
    const email = 'integration@test.com';
    const originalPassword = 'OriginalPass123!';
    const newPassword = 'NewPassword456!';

    // 1. Create user
    const user = new User({
      firstName: 'Integration',
      lastName: 'Test',
      email,
      password: originalPassword,
      role: UserRole.PARENT,
      active: true
    });
    await user.save();

    // 2. Verify original login works
    const loginUser = await User.findOne({ email });
    const originalLoginValid = await loginUser!.comparePassword(originalPassword);
    expect(originalLoginValid).toBe(true);

    // 3. Create password reset
    const resetRecord = new PasswordReset({
      email,
      code: '789012',
      isVerified: true,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
    });
    await resetRecord.save();

    // 4. Reset password
    const updatedUser = await User.findOne({ email });
    updatedUser!.password = newPassword;
    await updatedUser!.save();

    // 5. Verify old password doesn't work
    const oldPasswordValid = await updatedUser!.comparePassword(originalPassword);
    expect(oldPasswordValid).toBe(false);

    // 6. Verify new password works
    const newPasswordValid = await updatedUser!.comparePassword(newPassword);
    expect(newPasswordValid).toBe(true);

    // 7. Verify login with new password works
    const finalUser = await User.findOne({ email });
    const finalLoginValid = await finalUser!.comparePassword(newPassword);
    expect(finalLoginValid).toBe(true);

    console.log('✅ Full authentication integration test passed!');
  });
});