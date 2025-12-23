import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '../jwt.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Handle missing token
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // Extract token from header
    const token = this.jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAccessToken(token);
      
      // Attach user information to the request object for route handlers
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      // Handle invalid tokens
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  handleRequest(err: any, user: any, info: any) {
    // This method is called by the parent AuthGuard
    // We handle the logic in canActivate, so this is mainly for fallback
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}