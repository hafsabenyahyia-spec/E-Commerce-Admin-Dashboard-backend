# Implementation Plan: Supabase Integration

## Overview

This implementation plan sets up Supabase integration for a Tech E-commerce monorepo. The current directory serves as the NestJS backend, and we'll create a separate frontend directory for Next.js. The backend will use Prisma ORM to connect to Supabase PostgreSQL, while the frontend will use Supabase's client library for authentication and storage.

## Tasks

- [x] 1. Configure Backend Environment and Prisma
  - Update .env file with DATABASE_URL
  - Configure prisma/schema.prisma with PostgreSQL provider
  - Add .env to .gitignore if not already present
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 1.1 Write configuration validation tests for backend
  - Test that .env contains valid DATABASE_URL format
  - Test that schema.prisma specifies PostgreSQL provider
  - Test that .gitignore excludes .env files
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2. Install Prisma and Initialize Schema
  - Install @prisma/client and prisma as dev dependency
  - Run prisma db pull to introspect existing Supabase tables
  - Run prisma generate to create Prisma Client
  - _Requirements: 1.4_

- [x] 3. Create PrismaService in NestJS
  - [x] 3.1 Create src/prisma/prisma.service.ts
    - Extend PrismaClient
    - Implement OnModuleInit with $connect()
    - Implement OnModuleDestroy with $disconnect()
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Create src/prisma/prisma.module.ts
    - Mark module as @Global()
    - Export PrismaService
    - _Requirements: 2.6_

  - [x] 3.3 Import PrismaModule in app.module.ts
    - Add PrismaModule to imports array
    - _Requirements: 2.6_

- [x] 3.4 Write unit tests for PrismaService
  - Test that PrismaService extends PrismaClient
  - Test that onModuleInit is called on startup
  - Test that onModuleDestroy is called on shutdown
  - Test that service implements required interfaces
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 4. Checkpoint - Verify Backend Setup
  - Ensure Prisma schema is generated
  - Ensure PrismaService can be imported
  - Ask the user if questions arise

- [ ] 5. Create Frontend Directory Structure
  - Create frontend/ directory at root level
  - Initialize Next.js project in frontend/ directory
  - Create frontend/lib/ directory for utilities
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6. Configure Frontend Environment
  - Create frontend/.env.local file
  - Add NEXT_PUBLIC_SUPABASE_URL with provided URL
  - Add NEXT_PUBLIC_SUPABASE_ANON_KEY with provided key
  - Add .env.local to frontend/.gitignore
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]\* 6.1 Write configuration validation tests for frontend
  - Test that .env.local contains required variables
  - Test that variables use NEXT*PUBLIC* prefix
  - Test that .gitignore excludes .env.local
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Create Supabase Client Utility
  - [ ] 7.1 Install @supabase/supabase-js in frontend
    - Run npm install @supabase/supabase-js in frontend directory
    - _Requirements: 4.1_

  - [ ] 7.2 Create frontend/lib/supabaseClient.ts
    - Import createClient from @supabase/supabase-js
    - Read environment variables
    - Throw error if variables are missing
    - Export singleton supabase client instance
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 3.5_

- [ ]\* 7.3 Write unit tests for Supabase client
  - Test error throwing when env vars are missing
  - Test successful initialization with valid env vars
  - Test singleton pattern (same instance on multiple imports)
  - Test that client exposes auth and storage APIs
  - _Requirements: 3.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Update Root .gitignore
  - Ensure .env and .env.local are excluded
  - Ensure node_modules is excluded
  - Ensure both backend and frontend build directories are excluded
  - _Requirements: 5.1, 5.2_

- [ ]\* 8.1 Write tests for monorepo structure
  - Test that backend and frontend directories exist
  - Test that both have separate package.json files
  - Test that .gitignore excludes sensitive files
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 5.1, 5.2_

- [ ] 9. Final Checkpoint - Integration Verification
  - Verify backend can connect to Supabase database
  - Verify frontend Supabase client initializes without errors
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The current directory serves as the backend (NestJS)
- Frontend will be created in a new frontend/ directory
- Both applications can be deployed independently
- Use the provided Supabase credentials exactly as specified
- Database URL: `postgresql://postgres:E-Commerce Admin Dashboard!@1332/OP@db.cwegricjhtflfxfeioir.supabase.co:5432/postgres`
- Supabase URL: `https://cwegricjhtflfxfeioir.supabase.co`
- Supabase Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZWdyaWNqaHRmbGZ4ZmVpb2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTM2MzAsImV4cCI6MjA4MTc4OTYzMH0.srvftL-6NFrlNWwvvjltqRwdELBRyHqPeYsC5l0xYZs`
