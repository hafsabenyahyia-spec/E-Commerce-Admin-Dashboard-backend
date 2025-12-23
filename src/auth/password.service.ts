import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Hash a password using bcrypt with salt rounds
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns Promise<boolean> - True if passwords match
   */
  async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  }

  /**
   * Validate password strength requirements
   * @param password - Password to validate
   * @returns ValidationResult - Validation result with errors if any
   */
  validatePasswordStrength(password: string): ValidationResult {
    const errors: string[] = [];

    // Check minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for digit
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one digit');
    }

    // Check for special character
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}