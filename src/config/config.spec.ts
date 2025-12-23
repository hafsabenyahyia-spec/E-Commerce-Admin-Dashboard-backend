import * as fs from 'fs';
import * as path from 'path';

describe('Backend Configuration', () => {
  describe('Environment Configuration', () => {
    it('should have .env file with valid DATABASE_URL format', () => {
      const envPath = path.join(process.cwd(), '.env');
      expect(fs.existsSync(envPath)).toBe(true);

      const envContent = fs.readFileSync(envPath, 'utf8');
      expect(envContent).toContain('DATABASE_URL=');

      // Extract DATABASE_URL value
      const databaseUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
      expect(databaseUrlMatch).toBeTruthy();
      
      const databaseUrl = databaseUrlMatch![1];
      
      // Validate PostgreSQL connection string format
      expect(databaseUrl).toMatch(/^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/);
      
      // Validate it contains required components
      expect(databaseUrl).toContain('postgresql://');
      expect(databaseUrl).toContain('@');
      expect(databaseUrl).toContain(':5432/'); // Supabase direct connection port
    });
  });

  describe('Prisma Schema Configuration', () => {
    it('should have schema.prisma with PostgreSQL provider', () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      expect(fs.existsSync(schemaPath)).toBe(true);

      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Check for PostgreSQL provider
      expect(schemaContent).toContain('provider = "postgresql"');
      
      // Check for DATABASE_URL environment variable reference
      expect(schemaContent).toContain('url      = env("DATABASE_URL")');
      
      // Check for Prisma client generator
      expect(schemaContent).toContain('generator client');
      expect(schemaContent).toContain('provider        = "prisma-client-js"');
    });
  });

  describe('Git Ignore Configuration', () => {
    it('should exclude .env files from version control', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      // Check that .env files are excluded
      expect(gitignoreContent).toContain('.env');
      
      // Should exclude various .env variants
      const envPatterns = ['.env', '.env.local', '.env.development.local', '.env.test.local', '.env.production.local'];
      envPatterns.forEach(pattern => {
        expect(gitignoreContent).toContain(pattern);
      });
    });
  });
});