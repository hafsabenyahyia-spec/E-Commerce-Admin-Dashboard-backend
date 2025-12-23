import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';
import * as fc from 'fast-check';

// Mock bcrypt module
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      const password = 'TestPassword123!';
      const expectedHash = '$2b$12$hashedpassword';
      
      mockedBcrypt.hash.mockResolvedValue(expectedHash as never);
      
      const hashedPassword = await service.hashPassword(password);

      expect(hashedPassword).toBe(expectedHash);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = '$2b$12$hash1';
      const hash2 = '$2b$12$hash2';
      
      mockedBcrypt.hash
        .mockResolvedValueOnce(hash1 as never)
        .mockResolvedValueOnce(hash2 as never);

      const result1 = await service.hashPassword(password);
      const result2 = await service.hashPassword(password);

      expect(result1).not.toBe(result2);
      expect(result1).toBe(hash1);
      expect(result2).toBe(hash2);
    });

    it('should throw error when bcrypt hashing fails', async () => {
      const password = 'TestPassword123!';
      
      mockedBcrypt.hash.mockRejectedValue(new Error('Bcrypt error') as never);
      
      await expect(service.hashPassword(password)).rejects.toThrow('Password hashing failed');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(true as never);
      
      const result = await service.comparePasswords(password, hashedPassword);

      expect(result).toBe(true);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = '$2b$12$hashedpassword';
      
      mockedBcrypt.compare.mockResolvedValue(false as never);
      
      const result = await service.comparePasswords(wrongPassword, hashedPassword);

      expect(result).toBe(false);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(wrongPassword, hashedPassword);
    });

    it('should throw error when bcrypt comparison fails', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = 'somehashedpassword';
      
      mockedBcrypt.compare.mockRejectedValue(new Error('Bcrypt compare error') as never);
      
      await expect(service.comparePasswords(password, hashedPassword)).rejects.toThrow('Password comparison failed');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const password = 'StrongPass123!';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const password = 'Short1!';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without lowercase letter', () => {
      const password = 'PASSWORD123!';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const password = 'password123!';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without digit', () => {
      const password = 'PasswordTest!';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one digit');
    });

    it('should reject password without special character', () => {
      const password = 'Password123';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    it('should return multiple errors for weak password', () => {
      const password = 'weak';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    // Additional comprehensive weak password tests
    it('should reject extremely weak passwords with all validation errors', () => {
      const password = 'a'; // Too short, no uppercase, no digit, no special char
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one digit');
      expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    it('should reject empty password', () => {
      const password = '';
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password with only spaces', () => {
      const password = '        '; // 8 spaces
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one digit');
      expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    it('should reject password with unsupported special characters', () => {
      const password = 'Password123#'; // # is not in the allowed special chars
      const result = service.validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    it('should accept password with all allowed special characters', () => {
      const specialChars = ['@', '$', '!', '%', '*', '?', '&'];
      
      specialChars.forEach(char => {
        const password = `Password123${char}`;
        const result = service.validatePasswordStrength(password);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Property-Based Tests', () => {
    // Note: Property-based tests are moved to password.service.property.spec.ts
    // to avoid conflicts with mocked bcrypt in unit tests
  });
});
