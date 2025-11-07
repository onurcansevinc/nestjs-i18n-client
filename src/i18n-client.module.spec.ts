import { Test, TestingModule } from '@nestjs/testing';
import { I18nClientModuleOptions } from './interfaces';
import { I18nClientModule } from './i18n-client.module';
import { I18nClientService } from './i18n-client.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('I18nClientModule', () => {
  describe('forRoot', () => {
    it('should create module with synchronous options', async () => {
      const options: I18nClientModuleOptions = {
        apiUrl: process.env.I18N_API_URL || 'https://api.example.com',
        apiKey: process.env.I18N_API_KEY || 'test-token',
        defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'en',
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [I18nClientModule.forRoot(options)],
      }).compile();

      const service = module.get<I18nClientService>(I18nClientService);
      expect(service).toBeDefined();
      expect(service.getConfig()).toEqual(options);
    });

    it('should use default language when not provided', async () => {
      const options: I18nClientModuleOptions = {
        apiUrl: process.env.I18N_API_URL || 'https://api.example.com',
        apiKey: process.env.I18N_API_KEY || 'test-token',
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [I18nClientModule.forRoot(options)],
      }).compile();

      const service = module.get<I18nClientService>(I18nClientService);
      expect(service).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should create module with async options', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
          }),
          I18nClientModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              apiUrl:
                configService.get('I18N_API_URL') ||
                process.env.I18N_API_URL ||
                'https://api.example.com',
              apiKey:
                configService.get('I18N_API_KEY') ||
                process.env.I18N_API_KEY ||
                'test-token',
              defaultLanguage:
                configService.get('I18N_DEFAULT_LANGUAGE') ||
                process.env.I18N_DEFAULT_LANGUAGE ||
                'en',
            }),
            inject: [ConfigService],
          }),
        ],
      }).compile();

      const service = module.get<I18nClientService>(I18nClientService);
      expect(service).toBeDefined();
    });

    it('should create module with async factory function', async () => {
      const options: I18nClientModuleOptions = {
        apiUrl: process.env.I18N_API_URL || 'https://api.example.com',
        apiKey: process.env.I18N_API_KEY || 'test-token',
        defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'tr',
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [
          I18nClientModule.forRootAsync({
            useFactory: async () => {
              // Simulate async operation
              await new Promise((resolve) => setTimeout(resolve, 10));
              return options;
            },
          }),
        ],
      }).compile();

      const service = module.get<I18nClientService>(I18nClientService);
      expect(service).toBeDefined();
      expect(service.getConfig().defaultLanguage).toBe(
        process.env.I18N_DEFAULT_LANGUAGE || 'tr'
      );
    });
  });
});
