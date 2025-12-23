d# Implementation Plan: Authentication System

## Overview

This implementation plan converts the authentication system design into discrete coding tasks for a NestJS backend. The tasks build incrementally, starting with dependencies and core services, then implementing authentication logic, guards, and finally integration testing. Each task focuses on specific components while maintaining integration with the existing Supabase/Prisma setup.

## Tasks

- [x] 1. Install authentication dependencies and configure JWT module
  - Install required packages: @nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt, class-validator, class-transformer
  - Install dev dependencies: @types/bcrypt, @types/passport-jwt, fast-check
  - Configure JWT module with environment variables for secret and expiration times
  - _Requirements: 4.1, 4.2, 7.1_

- [x] 2. Create Users Module and Service
  - [x] 2.1 Create src/users/users.module.ts
    - Define UsersModule with PrismaService dependency
    - Export UsersService for use by other modules
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 2.2 Create src/users/users.service.ts
    - Implement user profile creation with Prisma
    - Implement findByEmail and findById methods
    - Handle database errors and user not found cases
    - _Requirements: 1.1, 2.1, 7.2_

  - [x] 2.3 Write property test for user creation
    - **Property 1: User Registration Creates Profile**
    - **Validates: Requirements 1.1**

  - [x] 2.4 Write unit tests for UsersService
    - Test user creation with valid data
    - Test findByEmail with existing and non-existing emails
    - Test error handling for database failures
    - _Requirements: 1.1, 2.1_

- [ ] 3. Create Password Service for secure hashing
  - [x] 3.1 Create src/auth/password.service.ts
    - Implement bcrypt password hashing with salt rounds
    - Implement password comparison method
    - Add password strength validation
    - _Requirements: 1.4, 1.5, 3.1, 3.2_

  - [x] 3.2 Write property test for password hashing
    - **Property 5: Password Hashing Security**
    - **Validates: Requirements 1.5, 3.1, 3.3**

  - [x] 3.3 Write property test for password validation
    - **Property 9: Password Validation Round Trip**
    - **Validates: Requirements 3.2**

  - [x] 3.4 Write unit tests for PasswordService
    - Test password strength validation with weak passwords
    - Test bcrypt hashing and comparison
    - Test error handling for hashing failures
    - _Requirements: 1.4, 1.5, 3.1, 3.2_

- [x] 4. Create JWT Service for token management
  - [x] 4.1 Create src/auth/jwt.service.ts
    - Implement access token generation (15 minutes expiration)
    - Implement refresh token generation (7 days expiration)
    - Implement token validation and payload extraction
    - Include user ID, email, and role in token payload
    - _Requirements: 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Write property test for token generation
    - **Property 6: Registration Token Generation**
    - **Validates: Requirements 1.6, 4.1, 4.2, 2.5**

  - [x] 4.3 Write property test for token validation
    - **Property 10: Token Validation and Expiration**
    - **Validates: Requirements 4.3, 4.4**

  - [x] 4.4 Write unit tests for JwtService
    - Test token generation with different user data
    - Test token validation with valid and invalid tokens
    - Test expired token handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Create Data Transfer Objects (DTOs)
  - [x] 5.1 Create src/auth/dto/register.dto.ts
    - Define RegisterDto with email, password, full_name validation
    - Add email format validation and password strength requirements
    - _Requirements: 1.3, 1.4, 9.1_

  - [x] 5.2 Create src/auth/dto/login.dto.ts
    - Define LoginDto with email and password validation
    - _Requirements: 9.2_

  - [x] 5.3 Create src/auth/dto/auth-response.dto.ts
    - Define AuthResponse interface for token and user data
    - _Requirements: 9.3_

  - [x] 5.4 Write property test for DTO validation 
    - **Property 16: DTO Validation**
    - **Validates: Requirements 9.4**

- [x] 6. Checkpoint - Core Services Complete
  - Ensure all services compile without errors
  - Ensure all tests pass
  - Ask the user if questions arise

- [x] 7. Create Authentication Service
  - [x] 7.1 Create src/auth/auth.service.ts
    - Implement user registration with duplicate email prevention
    - Implement user login with credential validation
    - Integrate PasswordService and JwtService
    - Handle authentication errors securely
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 8.1_

  - [ ]\* 7.2 Write property test for duplicate email prevention
    - **Property 2: Duplicate Email Prevention**
    - **Validates: Requirements 1.2**

  - [ ]\* 7.3 Write property test for authentication success
    - **Property 7: Authentication Success**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]\* 7.4 Write property test for authentication failure
    - **Property 8: Authentication Failure Security**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]\* 7.5 Write unit tests for AuthService
    - Test registration with valid and invalid data
    - Test login with correct and incorrect credentials
    - Test error message consistency
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 8.1_

- [x] 8. Create JWT Authentication Guard
  - [x] 8.1 Create src/auth/guards/jwt-auth.guard.ts
    - Extend AuthGuard('jwt') from @nestjs/passport
    - Handle missing tokens and invalid tokens
    - Extract user information for route handlers
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]\* 8.2 Write property test for route protection without token
    - **Property 11: Route Protection Without Token**
    - **Validates: Requirements 5.1**

  - [ ]\* 8.3 Write property test for route protection with invalid token
    - **Property 12: Route Protection With Invalid Token**
    - **Validates: Requirements 5.2**

  - [ ]\* 8.4 Write property test for route access with valid token
    - **Property 13: Route Access With Valid Token**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 9. Create Role-Based Access Guard
  - [x] 9.1 Create src/auth/guards/roles.guard.ts
    - Implement role checking from JWT token payload
    - Support admin and customer roles
    - Return 403 Forbidden for insufficient permissions
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 9.2 Write property test for role-based access control
    - **Property 14: Role-Based Access Control**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]\* 9.3 Write unit tests for RolesGuard
    - Test admin access to admin routes
    - Test customer access denial to admin routes
    - Test role extraction from JWT tokens
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Create JWT Strategy for Passport
  - [x] 10.1 Create src/auth/strategies/jwt.strategy.ts
    - Configure JWT strategy with secret and validation
    - Implement validate method to extract user from token
    - Handle token validation errors
    - _Requirements: 4.3, 5.3, 5.4_

  - [ ]\* 10.2 Write unit tests for JWT Strategy
    - Test token validation with valid payloads
    - Test user extraction from token
    - Test invalid token handling
    - _Requirements: 4.3, 5.3_

- [-] 11. Create Authentication Controller
  - [x] 11.1 Create src/auth/auth.controller.ts
    - Implement POST /auth/register endpoint
    - Implement POST /auth/login endpoint
    - Add proper error handling and HTTP status codes
    - Use validation pipes for DTOs
    - _Requirements: 1.1, 1.2, 2.1, 8.2, 8.4_

  - [ ]\* 11.2 Write property test for email format validation
    - **Property 3: Email Format Validation**
    - **Validates: Requirements 1.3**

  - [ ]\* 11.3 Write property test for password strength enforcement
    - **Property 4: Password Strength Enforcement**
    - **Validates: Requirements 1.4**

  - [ ]\* 11.4 Write property test for error message quality
    - **Property 15: Error Message Quality**
    - **Validates: Requirements 8.1, 8.2, 8.4**

  - [ ]\* 11.5 Write integration tests for auth endpoints
    - Test registration endpoint with various inputs
    - Test login endpoint with valid and invalid credentials
    - Test error responses and status codes
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 8.1, 8.2_

- [x] 12. Create Auth Module and configure Passport
  - [x] 12.1 Create src/auth/auth.module.ts
    - Configure PassportModule and JwtModule
    - Import UsersModule and export AuthService
    - Register JWT strategy and guards
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

  - [x] 12.2 Update src/app.module.ts
    - Import AuthModule
    - Ensure proper module dependencies
    - _Requirements: 7.4_

- [x] 13. Create protected route examples and role decorators
  - [x] 13.1 Create src/auth/decorators/roles.decorator.ts
    - Define @Roles decorator for role-based access control
    - _Requirements: 6.1, 6.2_

  - [x] 13.2 Create example protected routes in auth.controller.ts
    - Add GET /auth/profile endpoint (requires authentication)
    - Add GET /auth/admin endpoint (requires admin role)
    - Demonstrate guard usage
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2_

  - [ ]\* 13.3 Write integration tests for protected routes
    - Test profile access with and without tokens
    - Test admin route access with different roles
    - Test guard integration
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2_

- [x] 14. Final checkpoint - Complete authentication system
  - Ensure all endpoints work correctly
  - Ensure all guards protect routes properly
  - Ensure all tests pass
  - Test integration with existing Prisma setup
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end authentication flows
- All tasks build on the existing Supabase/Prisma integration
- JWT secrets should be stored in environment variables
- Password hashing uses bcrypt with appropriate salt rounds (12+)
- Access tokens expire in 15 minutes, refresh tokens in 7 days
