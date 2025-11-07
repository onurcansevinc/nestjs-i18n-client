import { I18nService } from 'nestjs-i18n';
import { I18nHttpLoader } from './i18n-http-loader';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nClientModuleOptions } from './interfaces';
import { I18nClientService } from './i18n-client.service';

describe('I18nClientService', () => {
  let service: I18nClientService;
  let mockI18nService: jest.Mocked<I18nService>;
  let mockLoader: jest.Mocked<I18nHttpLoader>;
  let options: I18nClientModuleOptions;

  beforeEach(async () => {
    options = {
      apiUrl: process.env.I18N_API_URL || 'https://api.example.com',
      apiKey: process.env.I18N_API_KEY || 'test-token',
      defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'en',
    };

    mockLoader = {
      healthCheck: jest.fn(),
      loadLanguageNamespace: jest.fn(),
      languages: jest.fn(),
    } as any;

    mockI18nService = {
      translate: jest.fn(),
      loader: mockLoader,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nClientService,
        {
          provide: 'I18N_CLIENT_OPTIONS',
          useValue: options,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<I18nClientService>(I18nClientService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('manualRefresh', () => {
    it('should refresh translations successfully', async () => {
      mockLoader.healthCheck.mockResolvedValue(true);
      mockLoader['getHttpClient'] = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: { languages: ['en', 'tr'] },
        }),
      });

      mockLoader.loadLanguageNamespace.mockResolvedValue({
        key1: 'value1',
      });

      await service.manualRefresh();

      expect(mockLoader.healthCheck).toHaveBeenCalled();
      expect(mockLoader.loadLanguageNamespace).toHaveBeenCalled();
    });

    it('should throw error when API is unhealthy', async () => {
      mockLoader.healthCheck.mockResolvedValue(false);

      await expect(service.manualRefresh()).rejects.toThrow(
        'Translation API is not healthy'
      );
    });

    it('should throw error when refresh fails', async () => {
      mockLoader.healthCheck.mockResolvedValue(true);
      const networkError = new Error('Network error');
      mockLoader['getHttpClient'] = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValue(networkError),
      });

      await expect(service.manualRefresh()).rejects.toThrow('Network error');
    });
  });

  describe('getTranslation', () => {
    it('should get translation successfully', async () => {
      mockI18nService.translate.mockReturnValue('Translated text');

      const result = await service.getTranslation('test.key');

      expect(result).toBe('Translated text');
      expect(mockI18nService.translate).toHaveBeenCalledWith('test.key', {
        lang: 'en',
        args: {},
      });
    });

    it('should use custom language', async () => {
      mockI18nService.translate.mockReturnValue('Çevrilmiş metin');

      const result = await service.getTranslation('test.key', 'tr');

      expect(result).toBe('Çevrilmiş metin');
      expect(mockI18nService.translate).toHaveBeenCalledWith('test.key', {
        lang: 'tr',
        args: {},
      });
    });

    it('should return key when translation fails', async () => {
      mockI18nService.translate.mockImplementation(() => {
        throw new Error('Translation not found');
      });

      const result = await service.getTranslation('test.key');

      expect(result).toBe('test.key');
    });
  });

  describe('healthCheck', () => {
    it('should check API health', async () => {
      mockLoader.healthCheck.mockResolvedValue(true);

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockLoader.healthCheck).toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return configuration', () => {
      const config = service.getConfig();

      expect(config).toEqual(options);
      expect(config).not.toBe(options); // Should be a copy
    });
  });

  describe('isRefreshInProgress', () => {
    it('should return false initially', () => {
      expect(service.isRefreshInProgress()).toBe(false);
    });

    it('should return true during refresh', async () => {
      mockLoader.healthCheck.mockResolvedValue(true);
      mockLoader['getHttpClient'] = jest.fn().mockReturnValue({
        get: jest.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              // Delay to allow checking isRefreshing flag
              setTimeout(() => resolve({ data: { languages: ['en'] } }), 10);
            })
        ),
      });
      mockLoader.loadLanguageNamespace.mockResolvedValue({});

      const refreshPromise = service.manualRefresh();

      // Check immediately - should be true
      expect(service.isRefreshInProgress()).toBe(true);

      await refreshPromise;
      expect(service.isRefreshInProgress()).toBe(false);
    });
  });
});
