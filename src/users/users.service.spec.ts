import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService, CreateUserDto } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { user_role } from '@prisma/client';
import * as fc from 'fast-check';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            profiles: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('Property-Based Tests', () => {
    it('should create user profile for any valid registration data', async () => {
      // Feature: authentication-system, Property 1: User Registration Creates Profile
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            full_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom(user_role.admin, user_role.customer),
          }),
          async (userData: CreateUserDto) => {
            // Mock that no existing user is found
            jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(null);
            
            // Mock successful user creation
            const expectedUser = {
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name,
              role: userData.role || user_role.customer,
              avatar_url: null,
              updated_at: new Date(),
            };
            jest.spyOn(prismaService.profiles, 'create').mockResolvedValue(expectedUser);

            const result = await service.create(userData);

            // Verify the user profile was created with the provided information
            expect(result).toEqual(expectedUser);
            expect(result.id).toBe(userData.id);
            expect(result.email).toBe(userData.email);
            expect(result.full_name).toBe(userData.full_name);
            expect(result.role).toBe(userData.role || user_role.customer);
            
            // Verify Prisma was called correctly
            expect(prismaService.profiles.create).toHaveBeenCalledWith({
              data: {
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role || user_role.customer,
                updated_at: expect.any(Date),
              },
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Unit Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('create', () => {
      it('should create user with valid data', async () => {
        const userData: CreateUserDto = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          full_name: 'Test User',
          role: user_role.customer,
        };

        const expectedUser = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role || null,
          avatar_url: null,
          updated_at: new Date(),
        };

        // Mock that no existing user is found
        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(null);
        jest.spyOn(prismaService.profiles, 'create').mockResolvedValue(expectedUser);

        const result = await service.create(userData);

        expect(result).toEqual(expectedUser);
        expect(prismaService.profiles.findUnique).toHaveBeenCalledWith({
          where: { email: userData.email },
        });
        expect(prismaService.profiles.create).toHaveBeenCalledWith({
          data: {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            updated_at: expect.any(Date),
          },
        });
      });

      it('should default to customer role when role is not provided', async () => {
        const userData: CreateUserDto = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          full_name: 'Test User',
        };

        const expectedUser = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: user_role.customer,
          avatar_url: null,
          updated_at: new Date(),
        };

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(null);
        jest.spyOn(prismaService.profiles, 'create').mockResolvedValue(expectedUser);

        const result = await service.create(userData);

        expect(result.role).toBe(user_role.customer);
        expect(prismaService.profiles.create).toHaveBeenCalledWith({
          data: {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            role: user_role.customer,
            updated_at: expect.any(Date),
          },
        });
      });

      it('should throw ConflictException when user with email already exists', async () => {
        const userData: CreateUserDto = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'existing@example.com',
          full_name: 'Test User',
        };

        const existingUser = {
          id: 'existing-id',
          email: userData.email,
          full_name: 'Existing User',
          role: user_role.customer,
          avatar_url: null,
          updated_at: new Date(),
        };

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(existingUser);

        await expect(service.create(userData)).rejects.toThrow(ConflictException);
        await expect(service.create(userData)).rejects.toThrow('User with this email already exists');
        expect(prismaService.profiles.create).not.toHaveBeenCalled();
      });

      it('should handle Prisma unique constraint violation (P2002)', async () => {
        const userData: CreateUserDto = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          full_name: 'Test User',
        };

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(null);
        const prismaError = new Error('Unique constraint violation');
        (prismaError as any).code = 'P2002';
        jest.spyOn(prismaService.profiles, 'create').mockRejectedValue(prismaError);

        await expect(service.create(userData)).rejects.toThrow(ConflictException);
        await expect(service.create(userData)).rejects.toThrow('User with this email already exists');
      });

      it('should re-throw other database errors', async () => {
        const userData: CreateUserDto = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          full_name: 'Test User',
        };

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(null);
        const databaseError = new Error('Database connection failed');
        jest.spyOn(prismaService.profiles, 'create').mockRejectedValue(databaseError);

        await expect(service.create(userData)).rejects.toThrow('Database connection failed');
      });
    });

    describe('findByEmail', () => {
      it('should return user when email exists', async () => {
        const email = 'existing@example.com';
        const existingUser = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: email,
          full_name: 'Existing User',
          role: user_role.customer,
          avatar_url: null,
          updated_at: new Date(),
        };

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(existingUser);

        const result = await service.findByEmail(email);

        expect(result).toEqual(existingUser);
        expect(prismaService.profiles.findUnique).toHaveBeenCalledWith({
          where: { email },
        });
      });

      it('should return null when email does not exist', async () => {
        const email = 'nonexistent@example.com';

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(null);

        const result = await service.findByEmail(email);

        expect(result).toBeNull();
        expect(prismaService.profiles.findUnique).toHaveBeenCalledWith({
          where: { email },
        });
      });

      it('should return null and log error when database fails', async () => {
        const email = 'test@example.com';
        const databaseError = new Error('Database connection failed');
        
        jest.spyOn(prismaService.profiles, 'findUnique').mockRejectedValue(databaseError);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await service.findByEmail(email);

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('Error finding user by email:', databaseError);
        
        consoleSpy.mockRestore();
      });
    });

    describe('findById', () => {
      it('should return user when id exists', async () => {
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const existingUser = {
          id: id,
          email: 'test@example.com',
          full_name: 'Test User',
          role: user_role.customer,
          avatar_url: null,
          updated_at: new Date(),
        };

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(existingUser);

        const result = await service.findById(id);

        expect(result).toEqual(existingUser);
        expect(prismaService.profiles.findUnique).toHaveBeenCalledWith({
          where: { id },
        });
      });

      it('should return null when id does not exist', async () => {
        const id = '123e4567-e89b-12d3-a456-426614174000';

        jest.spyOn(prismaService.profiles, 'findUnique').mockResolvedValue(null);

        const result = await service.findById(id);

        expect(result).toBeNull();
        expect(prismaService.profiles.findUnique).toHaveBeenCalledWith({
          where: { id },
        });
      });

      it('should return null and log error when database fails', async () => {
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const databaseError = new Error('Database connection failed');
        
        jest.spyOn(prismaService.profiles, 'findUnique').mockRejectedValue(databaseError);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await service.findById(id);

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('Error finding user by id:', databaseError);
        
        consoleSpy.mockRestore();
      });
    });
  });
});