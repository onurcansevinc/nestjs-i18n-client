import { I18nService } from 'nestjs-i18n';
import { CronJob } from 'cron';
import { I18nHttpLoader } from './i18n-http-loader';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nClientModuleOptions } from './interfaces';
import { I18nClientService } from './i18n-client.service';

jest.mock('cron', () => ({
  CronJob: {
    from: jest.fn(),
  },
}));

describe('I18nClientService', () => {
  let service: I18nClientService;
  let mockI18nService: jest.Mocked<I18nService>;
  let mockLoader: jest.Mocked<I18nHttpLoader>;
  let mockRefreshJob: { isActive: boolean; stop: jest.Mock };
  let options: I18nClientModuleOptions;

  beforeEach(async () => {
    (CronJob.from as jest.Mock).mockClear();
    mockRefreshJob = {
      isActive: true,
      stop: jest.fn().mockResolvedValue(undefined),
    };
    (CronJob.from as jest.Mock).mockReturnValue(mockRefreshJob);

    options = {
      apiUrl: process.env.I18N_API_URL || 'https://api.example.com',
      apiKey: process.env.I18N_API_KEY || 'test-token',
      defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'en',
    };

    mockLoader = {
      healthCheck: jest.fn(),
      languages: jest.fn(),
      load: jest.fn(),
      loadWithRetry: jest.fn(),
    } as any;

    mockI18nService = {
      translate: jest.fn(),
      refresh: jest.fn(),
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

  describe('scheduled refresh lifecycle', () => {
    it('should start an internal cron job on application bootstrap', () => {
      service.onApplicationBootstrap();

      expect(CronJob.from).toHaveBeenCalledWith({
        cronTime: '0 */3 * * *',
        name: 'refreshTranslations',
        onTick: expect.any(Function),
        start: true,
        timeZone: 'UTC',
        waitForCompletion: true,
      });
    });

    it('should not start a cron job when disabled', async () => {
      const disabledModule: TestingModule = await Test.createTestingModule({
        providers: [
          I18nClientService,
          {
            provide: 'I18N_CLIENT_OPTIONS',
            useValue: { ...options, enabled: false },
          },
          {
            provide: I18nService,
            useValue: mockI18nService,
          },
        ],
      }).compile();

      const disabledService =
        disabledModule.get<I18nClientService>(I18nClientService);

      disabledService.onApplicationBootstrap();

      expect(CronJob.from).not.toHaveBeenCalled();
    });

    it('should stop the internal cron job on module destroy', async () => {
      service.onApplicationBootstrap();

      await service.onModuleDestroy();

      expect(mockRefreshJob.stop).toHaveBeenCalled();
    });
  });

  describe('manualRefresh', () => {
    it('should refresh translations successfully', async () => {
      mockLoader.healthCheck.mockResolvedValue(true);
      mockLoader.loadWithRetry.mockResolvedValue({
        en: { hello: 'Hello' },
        tr: { hello: 'Merhaba' },
      });

      await service.manualRefresh();

      expect(mockLoader.healthCheck).toHaveBeenCalled();
      expect(mockI18nService.refresh).toHaveBeenCalledWith(
        {
          en: { hello: 'Hello' },
          tr: { hello: 'Merhaba' },
        },
        ['en', 'tr']
      );
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
      mockLoader.loadWithRetry.mockRejectedValue(networkError);

      await expect(service.manualRefresh()).rejects.toThrow('Network error');
    });

    it('should skip refresh when disabled', async () => {
      const disabledModule: TestingModule = await Test.createTestingModule({
        providers: [
          I18nClientService,
          {
            provide: 'I18N_CLIENT_OPTIONS',
            useValue: { ...options, enabled: false },
          },
          {
            provide: I18nService,
            useValue: mockI18nService,
          },
        ],
      }).compile();

      const disabledService =
        disabledModule.get<I18nClientService>(I18nClientService);

      await disabledService.refreshTranslations();

      expect(mockLoader.healthCheck).not.toHaveBeenCalled();
      expect(mockI18nService.refresh).not.toHaveBeenCalled();
    });

    it('should resolve loader from nestjs-i18n 10.8 loaders array', async () => {
      const i18nServiceWithLoaders = {
        translate: jest.fn(),
        refresh: jest.fn(),
        loaders: [mockLoader],
      } as any;

      const moduleWithLoaders: TestingModule = await Test.createTestingModule({
        providers: [
          I18nClientService,
          {
            provide: 'I18N_CLIENT_OPTIONS',
            useValue: options,
          },
          {
            provide: I18nService,
            useValue: i18nServiceWithLoaders,
          },
        ],
      }).compile();

      const serviceWithLoaders =
        moduleWithLoaders.get<I18nClientService>(I18nClientService);

      mockLoader.healthCheck.mockResolvedValue(true);
      mockLoader.loadWithRetry.mockResolvedValue({ en: {} });

      await serviceWithLoaders.manualRefresh();

      expect(i18nServiceWithLoaders.refresh).toHaveBeenCalledWith(
        { en: {} },
        ['en']
      );
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
      mockLoader.loadWithRetry.mockImplementation(
        () =>
          new Promise((resolve) => {
            // Delay to allow checking isRefreshing flag
            setTimeout(() => resolve({ en: {} }), 10);
          })
      );

      const refreshPromise = service.manualRefresh();

      // Check immediately - should be true
      expect(service.isRefreshInProgress()).toBe(true);

      await refreshPromise;
      expect(service.isRefreshInProgress()).toBe(false);
    });
  });
});
