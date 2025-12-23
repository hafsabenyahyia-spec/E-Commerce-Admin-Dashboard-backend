# Requirements Document

## Introduction

This document outlines the requirements for integrating Supabase into a Tech E-commerce monorepo consisting of a NestJS backend and Next.js frontend. The system will use Supabase as the PostgreSQL database provider via Prisma ORM in the backend, and leverage Supabase Auth and Storage capabilities in the frontend.

## Glossary

- **Backend**: The NestJS application that handles API requests and database operations
- **Frontend**: The Next.js application that provides the user interface
- **Supabase**: A Backend-as-a-Service platform providing PostgreSQL database, authentication, and storage
- **Prisma**: An ORM (Object-Relational Mapping) tool for TypeScript/JavaScript
- **PrismaService**: A NestJS service that manages database connections and lifecycle
- **Supabase_Client**: A frontend utility for interacting with Supabase services
- **Environment_Variables**: Configuration values stored in .env files

## Requirements

### Requirement 1: Backend Database Configuration

**User Story:** As a backend developer, I want to configure Prisma to connect to the Supabase PostgreSQL database, so that the NestJS application can perform database operations.

#### Acceptance Criteria

1. THE Backend SHALL store the DATABASE_URL in a .env file
2. WHEN the .env file is created, THE Backend SHALL include the complete PostgreSQL connection string with credentials
3. THE Prisma_Schema SHALL specify PostgreSQL as the database provider
4. WHEN Prisma is configured, THE Backend SHALL be able to introspect existing database tables
5. THE Backend SHALL exclude .env files from version control via .gitignore

### Requirement 2: Prisma Service Implementation

**User Story:** As a backend developer, I want a centralized Prisma service in NestJS, so that database connections are managed consistently across the application.

#### Acceptance Criteria

1. THE PrismaService SHALL extend PrismaClient to provide database access
2. WHEN the application starts, THE PrismaService SHALL establish a connection to the database
3. WHEN the application shuts down, THE PrismaService SHALL gracefully disconnect from the database
4. THE PrismaService SHALL implement the OnModuleInit lifecycle hook for connection initialization
5. THE PrismaService SHALL implement the OnModuleDestroy lifecycle hook for cleanup
6. THE PrismaService SHALL be injectable as a global module throughout the NestJS application

### Requirement 3: Frontend Supabase Configuration

**User Story:** As a frontend developer, I want to configure Supabase credentials in the Next.js application, so that I can use Supabase Auth and Storage features.

#### Acceptance Criteria

1. THE Frontend SHALL store the Supabase URL in a .env.local file
2. THE Frontend SHALL store the Supabase Anon Key in a .env.local file
3. WHEN environment variables are defined, THE Frontend SHALL prefix them with NEXT_PUBLIC_ for client-side access
4. THE Frontend SHALL exclude .env.local files from version control via .gitignore
5. WHEN the .env.local file is missing, THE Frontend SHALL provide clear error messages about missing configuration

### Requirement 4: Supabase Client Utility

**User Story:** As a frontend developer, I want a reusable Supabase client utility, so that I can interact with Supabase Auth and Storage consistently across the application.

#### Acceptance Criteria

1. THE Supabase_Client SHALL initialize using environment variables for URL and Anon Key
2. THE Supabase_Client SHALL provide access to authentication methods
3. THE Supabase_Client SHALL provide access to storage methods
4. WHEN the Supabase_Client is imported, THE Frontend SHALL use a singleton instance to avoid multiple connections
5. THE Supabase_Client SHALL be located in a shared utilities directory for easy access

### Requirement 5: Security and Best Practices

**User Story:** As a developer, I want to ensure sensitive credentials are protected, so that the application remains secure.

#### Acceptance Criteria

1. THE System SHALL exclude all .env and .env.local files from version control
2. THE System SHALL exclude node_modules directories from version control
3. WHEN sensitive data is stored, THE System SHALL use environment variables instead of hardcoding values
4. THE Backend SHALL use the Supabase service role key only for server-side operations requiring elevated privileges
5. THE Frontend SHALL use only the Anon Key for client-side operations

### Requirement 6: Monorepo Structure

**User Story:** As a developer, I want a clear monorepo structure, so that backend and frontend code are organized and maintainable.

#### Acceptance Criteria

1. THE System SHALL organize code into separate backend and frontend directories
2. WHEN the monorepo is structured, THE Backend SHALL reside in a dedicated folder
3. WHEN the monorepo is structured, THE Frontend SHALL reside in a dedicated folder
4. THE System SHALL maintain separate package.json files for backend and frontend when appropriate
5. THE System SHALL allow independent deployment of backend and frontend applications
