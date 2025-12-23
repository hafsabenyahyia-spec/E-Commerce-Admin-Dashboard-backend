import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as fc from 'fast-check';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';

describe('DTO Validation Properties', () => {
  describe('Property 16: DTO Validation', () => {
    it('should validate RegisterDto and return validation errors for invalid data', async () => {
      // Feature: authentication-system, Property 16: DTO Validation
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.oneof(
              fc.string().filter(s => !s.includes('@')), // Invalid email without @
              fc.string().filter(s => s.includes('@') && !s.includes('.')), // Invalid email without domain
              fc.constant(''), // Empty email
              fc.constant('invalid-email'), // Invalid format
            ),
            password: fc.oneof(
              fc.string({ maxLength: 7 }), // Too short
              fc.string({ minLength: 8 }).filter(s => !/[a-z]/.test(s) && /^[A-Za-z\d@$!%*?& ]+$/.test(s)), // No lowercase
              fc.string({ minLength: 8 }).filter(s => !/[A-Z]/.test(s) && /^[A-Za-z\d@$!%*?& ]+$/.test(s)), // No uppercase
              fc.string({ minLength: 8 }).filter(s => !/\d/.test(s) && /^[A-Za-z\d@$!%*?& ]+$/.test(s)), // No digit
              fc.string({ minLength: 8 }).filter(s => !/[@$!%*?&]/.test(s) && /^[A-Za-z\d@$!%*?& ]+$/.test(s)), // No special char
              fc.constant(''), // Empty password
              fc.string({ minLength: 8 }).filter(s => /[^A-Za-z\d@$!%*?& ]/.test(s)), // Contains invalid characters
            ),
            full_name: fc.oneof(
              fc.constant(''), // Empty name
              fc.constant('   '), // Whitespace only
            ),
          }),
          async (invalidData) => {
            const dto = plainToClass(RegisterDto, invalidData);
            const errors = await validate(dto);
            
            // Should have validation errors for invalid data
            expect(errors.length).toBeGreaterThan(0);
            
            // Each error should have constraints with meaningful messages
            errors.forEach(error => {
              expect(error.constraints).toBeDefined();
              if (error.constraints) {
                expect(Object.keys(error.constraints).length).toBeGreaterThan(0);
                
                // Check that error messages are descriptive
                Object.values(error.constraints).forEach(message => {
                  expect(typeof message).toBe('string');
                  expect(message.length).toBeGreaterThan(0);
                });
              }
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should validate LoginDto and return validation errors for invalid data', async () => {
      // Feature: authentication-system, Property 16: DTO Validation
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.oneof(
              fc.string().filter(s => !s.includes('@')), // Invalid email without @
              fc.string().filter(s => s.includes('@') && !s.includes('.')), // Invalid email without domain
              fc.constant(''), // Empty email
              fc.constant('invalid-email'), // Invalid format
            ),
            password: fc.oneof(
              fc.constant(''), // Empty password
              fc.constant('   '), // Whitespace only
            ),
          }),
          async (invalidData) => {
            const dto = plainToClass(LoginDto, invalidData);
            const errors = await validate(dto);
            
            // Should have validation errors for invalid data
            expect(errors.length).toBeGreaterThan(0);
            
            // Each error should have constraints with meaningful messages
            errors.forEach(error => {
              expect(error.constraints).toBeDefined();
              if (error.constraints) {
                expect(Object.keys(error.constraints).length).toBeGreaterThan(0);
                
                // Check that error messages are descriptive
                Object.values(error.constraints).forEach(message => {
                  expect(typeof message).toBe('string');
                  expect(message.length).toBeGreaterThan(0);
                });
              }
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should accept valid RegisterDto data without validation errors', async () => {
      // Feature: authentication-system, Property 16: DTO Validation
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.constantFrom(
              'Password1@', 'MySecret2$', 'StrongPass3!', 'ValidPass4%', 
              'GoodPass5*', 'TestPass6?', 'NewPass7&', 'SafePass8@',
              'SecurePass9$', 'ComplexPass0!'
            ),
            full_name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          async (validData) => {
            const dto = plainToClass(RegisterDto, validData);
            const errors = await validate(dto);
            
            // Should have no validation errors for valid data
            expect(errors.length).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should accept valid LoginDto data without validation errors', async () => {
      // Feature: authentication-system, Property 16: DTO Validation
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          async (validData) => {
            const dto = plainToClass(LoginDto, validData);
            const errors = await validate(dto);
            
            // Should have no validation errors for valid data
            expect(errors.length).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});