# Design Document: Supabase Integration

## Overview

This design outlines the integration of Supabase into a Tech E-commerce monorepo consisting of a NestJS backend and Next.js frontend. The backend will use Prisma ORM to connect to Supabase's PostgreSQL database, while the frontend will leverage Supabase's client library for authentication and storage capabilities.

The architecture follows a clear separation of concerns:
- Backend handles database operations through Prisma
- Frontend handles user authentication and file storage through Supabase client
- Environment variables manage sensitive credentials
- Both applications can be deployed independently

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Monorepo Root                          │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │   Backend (NestJS)   │    │  Frontend (Next.js)      │  │
│  │                      │    │                          │  │
│  │  ┌───────────────┐   │    │  ┌────────────────────┐ │  │
│  │  │ PrismaService │   │    │  │  Supabase Client   │ │  │
│  │  │   (Singleton) │   │    │  │    (Singleton)     │ │  │
│  │  └───────┬───────┘   │    │  └─────────┬──────────┘ │  │
│  │          │           │    │            │            │  │
│  │          │ Prisma    │    │            │ JS Client  │  │
│  │          │ Client    │    │            │ Library    │  │
│  └──────────┼───────────┘    └────────────┼────────────┘  │
│             │                             │                │
└─────────────┼─────────────────────────────┼────────────────┘
              │                             │
              │ PostgreSQL                  │ Auth/Storage
              │ Connection                  │ API Calls
              │                             │
         ┌────▼─────────────────────────────▼────┐
         │         Supabase Platform             │
         │  ┌──────────────┐  ┌──────────────┐  │
         │  │  PostgreSQL  │  │  Auth/Storage│  │
         │  │   Database   │  │   Services   │  │
         │  └──────────────┘  └──────────────┘  │
         └───────────────────────────────────────┘
```

### Directory Structure

```
monorepo/
├── backend/                    # NestJS application
│   ├── src/
│   │   ├── prisma/
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env                    # Backend environment variables
│   ├── .gitignore
│   └── package.json
│
├── frontend/                   # Next.js application
│   ├── lib/
│   │   └── supabaseClient.ts   # Supabase client utility
│   ├── .env.local              # Frontend environment variables
│   ├── .gitignore
│   └── package.json
│
└── .gitignore                  # Root gitignore
```

## Components and Interfaces

### Backend Components

#### 1. Environment Configuration (.env)

The backend `.env` file stores the PostgreSQL connection string:

```
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**Key considerations:**
- Connection string format follows PostgreSQL standard
- Must include username, password, host, port, and database name
- Supabase provides connection pooling on port 6543 for production use
- Direct connection on port 5432 for development and migrations

#### 2. Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models will be introspected from existing Supabase tables
```

**Key features:**
- Uses PostgreSQL provider
- Reads connection string from environment variable
- Supports schema introspection via `prisma db pull`
- Generates type-safe Prisma Client

#### 3. PrismaService (src/prisma/prisma.service.ts)

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Design decisions:**
- Extends `PrismaClient` to inherit all database methods
- Implements `OnModuleInit` for automatic connection on startup
- Implements `OnModuleDestroy` for graceful shutdown
- Injectable as a singleton throughout the application
- No manual connection management required in controllers/services

**Lifecycle:**
1. NestJS instantiates PrismaService
2. `onModuleInit()` called → establishes database connection
3. Service available for dependency injection
4. On shutdown, `onModuleDestroy()` called → closes connection

#### 4. Prisma Module (src/prisma/prisma.module.ts)

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Design decisions:**
- Marked as `@Global()` to avoid repeated imports
- Exports PrismaService for use in other modules
- Single source of truth for database access

### Frontend Components

#### 1. Environment Configuration (.env.local)

The frontend `.env.local` file stores Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
```

**Key considerations:**
- `NEXT_PUBLIC_` prefix makes variables available to client-side code
- Anon key is safe for client-side use (protected by Row Level Security)
- Never expose service role key in frontend code

#### 2. Supabase Client Utility (lib/supabaseClient.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Design decisions:**
- Singleton pattern - single client instance shared across application
- Early validation of environment variables with clear error messages
- Exported as named export for easy importing
- Provides access to all Supabase features (auth, storage, database)

**Usage examples:**

```typescript
// Authentication
import { supabase } from '@/lib/supabaseClient';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Storage
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('file-path', file);
```

## Data Models

### Prisma Schema Introspection

The backend will introspect existing Supabase tables using:

```bash
npx prisma db pull
```

This command:
1. Connects to the Supabase database
2. Reads the existing schema
3. Generates Prisma models in `schema.prisma`
4. Preserves existing table structures

After introspection, generate the Prisma Client:

```bash
npx prisma generate
```

This creates type-safe database access methods based on the schema.

### Example Model Structure

After introspection, models might look like:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@map("products")
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, most are configuration and setup checks that validate specific examples rather than universal properties. The criteria focus on:
- File existence and content validation
- Configuration format verification
- Class structure and interface implementation
- Directory structure validation

These are primarily example-based tests rather than property-based tests, as they verify specific configurations rather than behaviors across a range of inputs. There are no redundant properties to eliminate since each criterion checks a distinct aspect of the setup.

### Correctness Properties

Given the nature of this integration feature, most acceptance criteria are best validated through example-based tests rather than property-based tests. The requirements focus on configuration, file structure, and setup rather than algorithmic behavior across varied inputs.

**Configuration Validation Examples:**

**Example 1: Backend Environment Configuration**
Verify that the backend .env file contains a valid PostgreSQL connection string with all required components (protocol, user, password, host, port, database).
**Validates: Requirements 1.1, 1.2**

**Example 2: Prisma Schema Configuration**
Verify that the prisma/schema.prisma file specifies PostgreSQL as the provider and references the DATABASE_URL environment variable.
**Validates: Requirements 1.3**

**Example 3: PrismaService Structure**
Verify that PrismaService extends PrismaClient and implements both OnModuleInit and OnModuleDestroy interfaces.
**Validates: Requirements 2.1, 2.4, 2.5**

**Example 4: Frontend Environment Configuration**
Verify that the frontend .env.local file contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with valid values.
**Validates: Requirements 3.1, 3.2, 3.3**

**Example 5: Supabase Client Initialization**
Verify that the Supabase client throws a clear error when environment variables are missing, and successfully initializes when they are present.
**Validates: Requirements 3.5, 4.1**

**Example 6: Supabase Client API Access**
Verify that the initialized Supabase client exposes auth and storage APIs with expected methods.
**Validates: Requirements 4.2, 4.3**

**Example 7: Singleton Pattern**
Verify that multiple imports of the Supabase client return the same instance (object identity check).
**Validates: Requirements 4.4**

**Example 8: Git Ignore Configuration**
Verify that .gitignore files in both backend and frontend exclude sensitive files (.env, .env.local, node_modules).
**Validates: Requirements 1.5, 3.4, 5.1, 5.2**

**Example 9: Directory Structure**
Verify that the monorepo contains separate backend and frontend directories with their respective package.json files.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

## Error Handling

### Backend Error Handling

**Database Connection Errors:**
- If DATABASE_URL is missing or malformed, Prisma will throw a clear error during `$connect()`
- NestJS will fail to start if PrismaService cannot connect
- Error messages should indicate the connection string format issue

**Schema Introspection Errors:**
- If `prisma db pull` fails, verify database credentials and network connectivity
- Check that the database user has sufficient permissions to read schema
- Ensure the database is accessible from the development environment

**Runtime Database Errors:**
- Prisma Client will throw typed errors for constraint violations, not found records, etc.
- Services should catch and handle PrismaClientKnownRequestError appropriately
- Use try-catch blocks around database operations

### Frontend Error Handling

**Missing Environment Variables:**
- Supabase client utility throws error immediately if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are undefined
- Error message clearly states which variables are missing
- Application fails fast rather than at runtime when making API calls

**Authentication Errors:**
- Supabase auth methods return error objects with descriptive messages
- Handle common errors: invalid credentials, email already exists, weak password
- Display user-friendly error messages in the UI

**Storage Errors:**
- Handle file upload failures (size limits, invalid file types, network issues)
- Check for storage bucket permissions
- Provide feedback to users on upload progress and errors

## Testing Strategy

### Backend Testing

**Unit Tests:**
- Test PrismaService lifecycle hooks (onModuleInit, onModuleDestroy)
- Verify PrismaService can be injected into other services
- Test that PrismaService extends PrismaClient correctly

**Integration Tests:**
- Test actual database connection using test database
- Verify Prisma Client can perform CRUD operations
- Test schema introspection with sample tables

**Configuration Tests:**
- Verify .env file contains DATABASE_URL
- Verify prisma/schema.prisma has correct provider
- Verify .gitignore excludes .env files

### Frontend Testing

**Unit Tests:**
- Test Supabase client initialization with valid environment variables
- Test error throwing when environment variables are missing
- Verify singleton pattern (same instance on multiple imports)

**Integration Tests:**
- Test authentication flow with Supabase (sign up, sign in, sign out)
- Test file upload to Supabase storage
- Test that client can communicate with Supabase API

**Configuration Tests:**
- Verify .env.local contains required variables with NEXT_PUBLIC_ prefix
- Verify .gitignore excludes .env.local
- Verify supabaseClient.ts is in the correct location

### Testing Tools

**Backend:**
- Jest for unit and integration tests
- Supertest for API endpoint testing
- Test database for integration tests (separate from production)

**Frontend:**
- Jest and React Testing Library for component tests
- Mock Supabase client for unit tests
- Cypress or Playwright for E2E tests

### Test Configuration

All tests should:
- Run in CI/CD pipeline before deployment
- Use separate test databases/projects to avoid affecting production data
- Mock external services when appropriate for unit tests
- Use real Supabase connections for integration tests with test projects

**Minimum Test Coverage:**
- Unit tests: Focus on configuration validation and error handling
- Integration tests: Verify actual connectivity and basic operations
- E2E tests: Test critical user flows (authentication, file upload)

## Security Considerations

### Credential Management

1. **Never commit sensitive credentials to version control**
   - All .env and .env.local files must be in .gitignore
   - Use environment variables for all secrets
   - Rotate credentials if accidentally exposed

2. **Use appropriate keys for each context**
   - Frontend: Only use Anon Key (safe for client-side)
   - Backend: Can use Service Role Key for admin operations
   - Never expose Service Role Key in frontend code

3. **Connection string security**
   - Backend DATABASE_URL contains password - must be protected
   - Use connection pooling (port 6543) in production for better performance
   - Consider using Prisma Accelerate for additional connection management

### Supabase Security

1. **Row Level Security (RLS)**
   - Enable RLS on all tables in Supabase
   - Define policies to restrict data access based on authenticated user
   - Anon Key is safe because RLS protects data

2. **Storage Security**
   - Configure bucket policies to control file access
   - Use authenticated uploads for user-specific content
   - Set file size limits to prevent abuse

## Deployment Considerations

### Backend Deployment

- Set DATABASE_URL environment variable in deployment platform
- Run `prisma generate` during build process
- Run `prisma migrate deploy` for production migrations
- Ensure database is accessible from deployment environment

### Frontend Deployment

- Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in deployment platform
- Verify environment variables are available at build time
- Test that Supabase client initializes correctly in production

### Monorepo Deployment

- Backend and frontend can be deployed independently
- Use separate CI/CD pipelines for each application
- Consider using Vercel for Next.js and Railway/Render for NestJS
- Ensure both applications can communicate if needed (CORS configuration)
