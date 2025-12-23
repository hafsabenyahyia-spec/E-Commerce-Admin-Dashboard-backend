import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  /**
   * Validate JWT token payload and extract user information
   * This method is called automatically by Passport after token verification
   */
  async validate(payload: JwtPayload): Promise<any> {
    try {
      // Extract user ID from token payload
      const userId = payload.sub;
      
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload: missing user ID');
      }

      // Fetch user from database to ensure they still exist
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        throw new UnauthorizedException('User not found or has been deactivated');
      }

      // Return user object that will be attached to request.user
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      };
    } catch (error) {
      // Handle any errors during user validation
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Log unexpected errors but don't expose details to client
      console.error('JWT Strategy validation error:', error);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}