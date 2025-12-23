import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService as CustomJwtService } from './jwt.service';
import { PasswordService } from './password.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    // Import UsersModule to access UsersService
    UsersModule,
    
    // Import PrismaModule for database access
    PrismaModule,
    
    // Configure PassportModule with default JWT strategy
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false,
    }),
    
    // Configure JwtModule with dynamic configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenExpiration') || '15m' as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Core authentication services
    AuthService,
    CustomJwtService,
    PasswordService,
    
    // JWT strategy for Passport
    JwtStrategy,
    
    // Authentication and authorization guards
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    // Export AuthService for use by other modules
    AuthService,
    
    // Export guards for use in other modules
    JwtAuthGuard,
    RolesGuard,
    
    // Export JWT and Password services for potential reuse
    CustomJwtService,
    PasswordService,
  ],
})
export class AuthModule {}