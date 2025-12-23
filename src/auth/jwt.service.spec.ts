import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as fc from 'fast-check';
import * as jwt from 'jsonwebtoken';
import { JwtService, JwtPayload } from './jwt.service';
import jwtConfig from '../config/jwt.config';

describe('JwtService', () => {
  let service: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [jwtConfig],
          isGlobal: true,
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Unit Tests', () => {
    describe('Token Generation', () => {
      it('should generate tokens for admin user', async () => {
        const payload: JwtPayload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          role: 'admin',
        };

        const tokens = await service.generateTokens(payload);

        expect(tokens).toHaveProperty('access_token');
        expect(tokens).toHaveProperty('refresh_token');
        expect(typeof tokens.access_token).toBe('string');
        expect(typeof tokens.refresh_token).toBe('string');

        // Verify payload in tokens
        const accessDecoded = jwt.decode(tokens.access_token) as any;
        expect(accessDecoded.sub).toBe(payload.sub);
        expect(accessDecoded.email).toBe(payload.email);
        expect(accessDecoded.role).toBe(payload.role);
      });

      it('should generate tokens for customer user', async () => {
        const payload: JwtPayload = {
          sub: '987e6543-e21b-43d3-a654-426614174999',
          email: 'customer@example.com',
          role: 'customer',
        };

        const tokens = await service.generateTokens(payload);

        expect(tokens).toHaveProperty('access_token');
        expect(tokens).toHaveProperty('refresh_token');

        const refreshDecoded = jwt.decode(tokens.refresh_token) as any;
        expect(refreshDecoded.sub).toBe(payload.sub);
        expect(refreshDecoded.email).toBe(payload.email);
        expect(refreshDecoded.role).toBe(payload.role);
      });

      it('should generate different tokens for different users', async () => {
        const payload1: JwtPayload = {
          sub: '111e1111-e11b-11d3-a111-111111111111',
          email: 'user1@example.com',
          role: 'customer',
        };

        const payload2: JwtPayload = {
          sub: '222e2222-e22b-22d3-a222-222222222222',
          email: 'user2@example.com',
          role: 'admin',
        };

        const tokens1 = await service.generateTokens(payload1);
        const tokens2 = await service.generateTokens(payload2);

        expect(tokens1.access_token).not.toBe(tokens2.access_token);
        expect(tokens1.refresh_token).not.toBe(tokens2.refresh_token);
      });
    });

    describe('Token Validation', () => {
      it('should validate a valid access token', async () => {
        const payload: JwtPayload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'customer',
        };

        const tokens = await service.generateTokens(payload);
        const verified = await service.verifyAccessToken(tokens.access_token);

        expect(verified.sub).toBe(payload.sub);
        expect(verified.email).toBe(payload.email);
        expect(verified.role).toBe(payload.role);
        expect(verified).toHaveProperty('iat');
        expect(verified).toHaveProperty('exp');
      });

      it('should validate a valid refresh token', async () => {
        const payload: JwtPayload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'admin',
        };

        const tokens = await service.generateTokens(payload);
        const verified = await service.verifyRefreshToken(tokens.refresh_token);

        expect(verified.sub).toBe(payload.sub);
        expect(verified.email).toBe(payload.email);
        expect(verified.role).toBe(payload.role);
      });

      it('should reject an invalid access token', async () => {
        const invalidToken = 'invalid.token.string';

        await expect(service.verifyAccessToken(invalidToken)).rejects.toThrow(
          'Invalid or expired access token',
        );
      });

      it('should reject an invalid refresh token', async () => {
        const invalidToken = 'invalid.token.string';

        await expect(service.verifyRefreshToken(invalidToken)).rejects.toThrow(
          'Invalid or expired refresh token',
        );
      });

      it('should reject a malformed token', async () => {
        const malformedToken = 'not-a-jwt';

        await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow(
          'Invalid or expired access token',
        );
      });

      it('should reject a token with wrong signature', async () => {
        const payload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'customer',
        };

        const tokenWithWrongSignature = jwt.sign(payload, 'wrong-secret', {
          expiresIn: '15m',
        });

        await expect(
          service.verifyAccessToken(tokenWithWrongSignature),
        ).rejects.toThrow('Invalid or expired access token');
      });
    });

    describe('Expired Token Handling', () => {
      it('should reject an expired access token', async () => {
        const secret =
          configService.get<string>('jwt.secret') || 'default-secret';
        const payload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'customer',
        };

        const expiredToken = jwt.sign(payload, secret, { expiresIn: '-1s' });

        await expect(service.verifyAccessToken(expiredToken)).rejects.toThrow(
          'Invalid or expired access token',
        );
      });

      it('should reject an expired refresh token', async () => {
        const secret =
          configService.get<string>('jwt.secret') || 'default-secret';
        const payload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'admin',
        };

        const expiredToken = jwt.sign(payload, secret, { expiresIn: '-10s' });

        await expect(service.verifyRefreshToken(expiredToken)).rejects.toThrow(
          'Invalid or expired refresh token',
        );
      });

      it('should accept a token that has not expired yet', async () => {
        const payload: JwtPayload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'customer',
        };

        const tokens = await service.generateTokens(payload);
        
        // Token should be valid immediately after generation
        await expect(
          service.verifyAccessToken(tokens.access_token),
        ).resolves.toBeDefined();
      });
    });

    describe('Token Extraction', () => {
      it('should extract token from valid Bearer header', () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
        const authHeader = `Bearer ${token}`;

        const extracted = service.extractTokenFromHeader(authHeader);

        expect(extracted).toBe(token);
      });

      it('should return null for missing header', () => {
        const extracted = service.extractTokenFromHeader('');

        expect(extracted).toBeNull();
      });

      it('should return null for invalid header format', () => {
        const extracted = service.extractTokenFromHeader('InvalidFormat token');

        expect(extracted).toBeNull();
      });

      it('should return null for missing token', () => {
        const extracted = service.extractTokenFromHeader('Bearer ');

        expect(extracted).toBeNull();
      });
    });

    describe('Token Refresh', () => {
      it('should refresh tokens using valid refresh token', async () => {
        const payload: JwtPayload = {
          sub: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'customer',
        };

        const originalTokens = await service.generateTokens(payload);
        
        // Add a small delay to ensure different iat timestamps
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newTokens = await service.refreshTokens(
          originalTokens.refresh_token,
        );

        expect(newTokens).toHaveProperty('access_token');
        expect(newTokens).toHaveProperty('refresh_token');
        expect(newTokens.access_token).not.toBe(originalTokens.access_token);
        expect(newTokens.refresh_token).not.toBe(originalTokens.refresh_token);

        // Verify new tokens contain same user data
        const verified = await service.verifyAccessToken(newTokens.access_token);
        expect(verified.sub).toBe(payload.sub);
        expect(verified.email).toBe(payload.email);
        expect(verified.role).toBe(payload.role);
      });

      it('should reject refresh with invalid token', async () => {
        const invalidToken = 'invalid.refresh.token';

        await expect(service.refreshTokens(invalidToken)).rejects.toThrow(
          'Invalid or expired refresh token',
        );
      });
    });
  });

  describe('Property Tests', () => {
    it('should generate tokens with proper structure and expiration for any valid payload', async () => {
      // Feature: authentication-system, Property 6: Registration Token Generation
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sub: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('admin', 'customer'),
          }),
          async (payload: JwtPayload) => {
            // Generate tokens
            const tokens = await service.generateTokens(payload);

            // Verify both tokens are returned
            expect(tokens).toHaveProperty('access_token');
            expect(tokens).toHaveProperty('refresh_token');
            expect(typeof tokens.access_token).toBe('string');
            expect(typeof tokens.refresh_token).toBe('string');
            expect(tokens.access_token).not.toBe('');
            expect(tokens.refresh_token).not.toBe('');

            // Decode tokens to verify structure and expiration
            const secret = configService.get<string>('jwt.secret') || 'default-secret';
            
            const accessDecoded = jwt.decode(tokens.access_token) as any;
            const refreshDecoded = jwt.decode(tokens.refresh_token) as any;

            // Verify payload structure includes required fields
            expect(accessDecoded.sub).toBe(payload.sub);
            expect(accessDecoded.email).toBe(payload.email);
            expect(accessDecoded.role).toBe(payload.role);
            expect(accessDecoded).toHaveProperty('iat');
            expect(accessDecoded).toHaveProperty('exp');

            expect(refreshDecoded.sub).toBe(payload.sub);
            expect(refreshDecoded.email).toBe(payload.email);
            expect(refreshDecoded.role).toBe(payload.role);
            expect(refreshDecoded).toHaveProperty('iat');
            expect(refreshDecoded).toHaveProperty('exp');

            // Verify expiration times
            const now = Math.floor(Date.now() / 1000);
            const accessExpiration = accessDecoded.exp - now;
            const refreshExpiration = refreshDecoded.exp - now;

            // Access token should expire in approximately 15 minutes (900 seconds)
            // Allow some tolerance for test execution time
            expect(accessExpiration).toBeGreaterThan(890); // 14.8 minutes
            expect(accessExpiration).toBeLessThan(910); // 15.2 minutes

            // Refresh token should expire in approximately 7 days (604800 seconds)
            // Allow some tolerance for test execution time
            expect(refreshExpiration).toBeGreaterThan(604790); // ~7 days - 10 seconds
            expect(refreshExpiration).toBeLessThan(604810); // ~7 days + 10 seconds

            // Verify tokens can be verified with the secret
            expect(() => jwt.verify(tokens.access_token, secret)).not.toThrow();
            expect(() => jwt.verify(tokens.refresh_token, secret)).not.toThrow();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should validate tokens correctly and reject expired or invalid tokens', async () => {
      // Feature: authentication-system, Property 10: Token Validation and Expiration
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sub: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('admin', 'customer'),
          }),
          async (payload: JwtPayload) => {
            // Generate valid tokens
            const tokens = await service.generateTokens(payload);

            // Test 1: Valid tokens should be verified successfully
            const verifiedAccess = await service.verifyAccessToken(tokens.access_token);
            const verifiedRefresh = await service.verifyRefreshToken(tokens.refresh_token);

            // Verify the payload is correctly extracted
            expect(verifiedAccess.sub).toBe(payload.sub);
            expect(verifiedAccess.email).toBe(payload.email);
            expect(verifiedAccess.role).toBe(payload.role);
            expect(verifiedAccess).toHaveProperty('iat');
            expect(verifiedAccess).toHaveProperty('exp');

            expect(verifiedRefresh.sub).toBe(payload.sub);
            expect(verifiedRefresh.email).toBe(payload.email);
            expect(verifiedRefresh.role).toBe(payload.role);
            expect(verifiedRefresh).toHaveProperty('iat');
            expect(verifiedRefresh).toHaveProperty('exp');

            // Test 2: Invalid tokens should be rejected
            const invalidToken = 'invalid.token.here';
            await expect(service.verifyAccessToken(invalidToken)).rejects.toThrow('Invalid or expired access token');
            await expect(service.verifyRefreshToken(invalidToken)).rejects.toThrow('Invalid or expired refresh token');

            // Test 3: Malformed tokens should be rejected
            const malformedToken = 'not-a-jwt-token';
            await expect(service.verifyAccessToken(malformedToken)).rejects.toThrow('Invalid or expired access token');
            await expect(service.verifyRefreshToken(malformedToken)).rejects.toThrow('Invalid or expired refresh token');

            // Test 4: Tokens with wrong signature should be rejected
            const secret = configService.get<string>('jwt.secret') || 'default-secret';
            const wrongSecret = 'wrong-secret';
            const tokenWithWrongSignature = jwt.sign(
              { sub: payload.sub, email: payload.email, role: payload.role },
              wrongSecret,
              { expiresIn: '15m' }
            );
            
            await expect(service.verifyAccessToken(tokenWithWrongSignature)).rejects.toThrow('Invalid or expired access token');
            await expect(service.verifyRefreshToken(tokenWithWrongSignature)).rejects.toThrow('Invalid or expired refresh token');

            // Test 5: Expired tokens should be rejected
            const expiredToken = jwt.sign(
              { sub: payload.sub, email: payload.email, role: payload.role },
              secret,
              { expiresIn: '-1s' } // Already expired
            );
            
            await expect(service.verifyAccessToken(expiredToken)).rejects.toThrow('Invalid or expired access token');
            await expect(service.verifyRefreshToken(expiredToken)).rejects.toThrow('Invalid or expired refresh token');
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});