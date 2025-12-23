import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate both access and refresh tokens for a user
   */
  async generateTokens(payload: JwtPayload): Promise<TokenPair> {
    const jwtPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.generateAccessToken(jwtPayload),
      this.generateRefreshToken(jwtPayload),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  /**
   * Generate access token with 15 minutes expiration
   */
  private async generateAccessToken(payload: Record<string, any>): Promise<string> {
    const secret = this.configService.get<string>('jwt.secret') || 'default-secret';
    const expiresIn = this.configService.get<string>('jwt.accessTokenExpiration') || '15m';

    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, { expiresIn: expiresIn as any }, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token as string);
        }
      });
    });
  }

  /**
   * Generate refresh token with 7 days expiration
   */
  private async generateRefreshToken(payload: Record<string, any>): Promise<string> {
    const secret = this.configService.get<string>('jwt.secret') || 'default-secret';
    const expiresIn = this.configService.get<string>('jwt.refreshTokenExpiration') || '7d';

    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, { expiresIn: expiresIn as any }, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token as string);
        }
      });
    });
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('jwt.secret') || 'default-secret';
      
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
          if (err) {
            reject(new UnauthorizedException('Invalid or expired access token'));
          } else {
            const payload = decoded as any;
            resolve({
              sub: payload.sub,
              email: payload.email,
              role: payload.role,
              iat: payload.iat,
              exp: payload.exp,
            });
          }
        });
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('jwt.secret') || 'default-secret';
      
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
          if (err) {
            reject(new UnauthorizedException('Invalid or expired refresh token'));
          } else {
            const payload = decoded as any;
            resolve({
              sub: payload.sub,
              email: payload.email,
              role: payload.role,
              iat: payload.iat,
              exp: payload.exp,
            });
          }
        });
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * Refresh tokens using a valid refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const payload = await this.verifyRefreshToken(refreshToken);
    
    // Generate new tokens with the same payload
    const tokens = await this.generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return tokens;
  }
}