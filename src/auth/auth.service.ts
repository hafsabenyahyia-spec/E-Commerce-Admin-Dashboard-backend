import { 
  Injectable, 
  ConflictException, 
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { profiles } from '@prisma/client';

import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { JwtService } from './jwt.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, TokenResponse } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Register a new user with duplicate email prevention
   * @param registerDto - Registration data containing email, password, and full_name
   * @returns Promise<AuthResponse> - Authentication response with tokens and user data
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      // Validate password strength
      const passwordValidation = this.passwordService.validatePasswordStrength(registerDto.password);
      if (!passwordValidation.isValid) {
        throw new BadRequestException({
          message: 'Password does not meet strength requirements',
          errors: passwordValidation.errors,
        });
      }

      // Check for duplicate email
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash the password
      const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

      // Generate unique user ID
      const userId = randomUUID();

      // Create user in auth.users table with encrypted password
      await this.prisma.users.create({
        data: {
          id: userId,
          email: registerDto.email,
          encrypted_password: hashedPassword,
          email_confirmed_at: new Date(), // Auto-confirm for this implementation
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Create user profile in public.profiles table
      const user = await this.usersService.create({
        id: userId,
        email: registerDto.email,
        full_name: registerDto.full_name,
        role: 'customer', // Default role
      });

      // Generate tokens
      const tokens = await this.jwtService.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role || 'customer',
      });

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role as 'admin' | 'customer',
          full_name: user.full_name || '',
        },
      };
    } catch (error) {
      // Handle known errors
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Handle Prisma unique constraint violations
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }

      // Handle unexpected errors securely
      console.error('Registration error:', error);
      throw new InternalServerErrorException('Registration failed. Please try again.');
    }
  }

  /**
   * Authenticate user login with credential validation
   * @param loginDto - Login credentials containing email and password
   * @returns Promise<AuthResponse> - Authentication response with tokens and user data
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.usersService.findByEmail(loginDto.email);
      
      // Generic error message to prevent user enumeration
      const invalidCredentialsError = new UnauthorizedException('Invalid credentials');

      if (!user) {
        throw invalidCredentialsError;
      }

      // Validate user credentials
      const isValidUser = await this.validateUser(loginDto.email, loginDto.password);
      if (!isValidUser) {
        throw invalidCredentialsError;
      }

      // Generate tokens
      const tokens = await this.jwtService.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role || 'customer',
      });

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role as 'admin' | 'customer',
          full_name: user.full_name || '',
        },
      };
    } catch (error) {
      // Handle known authentication errors
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle unexpected errors securely
      console.error('Login error:', error);
      throw new InternalServerErrorException('Authentication failed. Please try again.');
    }
  }

  /**
   * Refresh authentication tokens using a valid refresh token
   * @param refreshToken - Valid refresh token
   * @returns Promise<TokenResponse> - New access and refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    try {
      return await this.jwtService.refreshTokens(refreshToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Token refresh error:', error);
      throw new InternalServerErrorException('Token refresh failed. Please login again.');
    }
  }

  /**
   * Validate user credentials during login
   * @param email - User email
   * @param password - Plain text password
   * @returns Promise<profiles | null> - User profile if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<profiles | null> {
    try {
      // Find user in auth.users table to get encrypted password
      const authUser = await this.prisma.users.findFirst({
        where: { email },
      });

      if (!authUser || !authUser.encrypted_password) {
        return null;
      }

      // Compare provided password with stored hash
      const isPasswordValid = await this.passwordService.comparePasswords(
        password,
        authUser.encrypted_password,
      );

      if (!isPasswordValid) {
        return null;
      }

      // Get user profile from public.profiles table
      const userProfile = await this.usersService.findByEmail(email);
      return userProfile;
    } catch (error) {
      console.error('User validation error:', error);
      return null;
    }
  }
}