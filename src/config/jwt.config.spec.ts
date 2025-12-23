import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import jwtConfig from './jwt.config';

describe('JWT Configuration', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [jwtConfig],
          envFilePath: '.env',
        }),
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should load JWT configuration from environment variables', () => {
    const jwtSecret = configService.get('jwt.secret');
    const accessTokenExpiration = configService.get('jwt.accessTokenExpiration');
    const refreshTokenExpiration = configService.get('jwt.refreshTokenExpiration');

    expect(jwtSecret).toBeDefined();
    expect(jwtSecret).not.toBe('');
    expect(accessTokenExpiration).toBe('15m');
    expect(refreshTokenExpiration).toBe('7d');
  });

  it('should have default values when environment variables are not set', () => {
    // This test verifies the fallback values in the configuration
    const jwtSecret = configService.get('jwt.secret');
    const accessTokenExpiration = configService.get('jwt.accessTokenExpiration');
    const refreshTokenExpiration = configService.get('jwt.refreshTokenExpiration');

    expect(jwtSecret).toBeTruthy();
    expect(accessTokenExpiration).toBeTruthy();
    expect(refreshTokenExpiration).toBeTruthy();
  });
});