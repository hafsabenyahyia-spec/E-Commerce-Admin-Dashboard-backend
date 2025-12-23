import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { profiles, user_role } from '@prisma/client';

export interface CreateUserDto {
  id: string;
  email: string;
  full_name: string;
  role?: user_role;
}

export interface UpdateUserDto {
  full_name?: string;
  avatar_url?: string;
  role?: user_role;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(userData: CreateUserDto): Promise<profiles> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const user = await this.prisma.profiles.create({
        data: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role || user_role.customer,
          updated_at: new Date(),
        },
      });

      return user;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // Handle Prisma unique constraint violations
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      
      // Re-throw other database errors
      throw error;
    }
  }

  async findByEmail(email: string): Promise<profiles | null> {
    try {
      const user = await this.prisma.profiles.findUnique({
        where: { email },
      });

      return user;
    } catch (error) {
      // Log error but don't throw - return null for not found
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findById(id: string): Promise<profiles | null> {
    try {
      const user = await this.prisma.profiles.findUnique({
        where: { id },
      });

      return user;
    } catch (error) {
      // Log error but don't throw - return null for not found
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async updateProfile(id: string, updateData: UpdateUserDto): Promise<profiles> {
    try {
      // Check if user exists
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      const updatedUser = await this.prisma.profiles.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle Prisma record not found
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      
      // Re-throw other database errors
      throw error;
    }
  }
}