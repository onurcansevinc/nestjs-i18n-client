import { Logger } from '@nestjs/common';
import { I18nHttpLoader } from './i18n-http-loader';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { I18nClientModuleOptions, I18nClientError } from './interfaces';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('I18nHttpLoader', () => {
  let loader: I18nHttpLoader;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;
  let options: I18nClientModuleOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    // Don't use fake timers by default - only for retry mechanism tests

    options = {
      apiUrl: process.env.I18N_API_URL || 'https://api.example.com',
      apiKey: process.env.I18N_API_KEY || 'test-token',
      defaultLanguage: process.env.I18N_DEFAULT_LANGUAGE || 'en',
    };

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with valid options', () => {
      loader = new I18nHttpLoader(options);
      expect(loader).toBeDefined();
    });

    it('should warn when options are missing', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      loader = new I18nHttpLoader({} as I18nClientModuleOptions);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should set default retry config', () => {
      loader = new I18nHttpLoader(options);
      expect(loader).toBeDefined();
    });

    it('should use custom retry config', () => {
      const customOptions: I18nClientModuleOptions = {
        ...options,
        retryConfig: {
          maxRetries: 5,
          baseDelay: 500,
          maxDelay: 5000,
          backoffMultiplier: 3,
        },
      };
      loader = new I18nHttpLoader(customOptions);
      expect(loader).toBeDefined();
    });
  });

  describe('languages', () => {
    beforeEach(() => {
      loader = new I18nHttpLoader(options);
    });

    it('should fetch languages successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            languages: ['en', 'tr', 'de'],
          },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse as any);

      const languages = await loader.languages();

      expect(languages).toEqual(['en', 'tr', 'de']);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/translations/language'
      );
    });

    it('should return default language when API fails', async () => {
      // Use real timers for this test since retry will fail quickly
      jest.useRealTimers();
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const languages = await loader.languages();

      expect(languages).toEqual(['en']);
    });

    it('should return default language when success is false', async () => {
      const mockResponse = {
        data: {
          success: false,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse as any);

      const languages = await loader.languages();

      expect(languages).toEqual(['en']);
    });
  });

  describe('load', () => {
    beforeEach(() => {
      loader = new I18nHttpLoader(options);
    });

    it('should load all translations successfully', async () => {
      const languagesResponse = {
        data: {
          success: true,
          data: {
            languages: ['en', 'tr'],
          },
        },
      };

      const enTranslations = {
        data: {
          success: true,
          data: {
            key1: 'value1',
            key2: 'value2',
          },
        },
      };

      const trTranslations = {
        data: {
          success: true,
          data: {
            key1: 'değer1',
            key2: 'değer2',
          },
        },
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce(languagesResponse as any)
        .mockResolvedValueOnce(enTranslations as any)
        .mockResolvedValueOnce(trTranslations as any);

      const translations = await loader.load();

      expect(translations).toEqual({
        en: { key1: 'value1', key2: 'value2' },
        tr: { key1: 'değer1', key2: 'değer2' },
      });
    });

    it('should throw error when loading fails', async () => {
      // Use real timers - retry will fail quickly
      jest.useRealTimers();
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(loader.load()).rejects.toThrow(I18nClientError);
    });
  });

  describe('loadLanguageNamespace', () => {
    beforeEach(() => {
      loader = new I18nHttpLoader(options);
    });

    it('should load language translations without namespace', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            key1: 'value1',
          },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse as any);

      const translations = await loader.loadLanguageNamespace('en');

      expect(translations).toEqual({ key1: 'value1' });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/translations/en');
    });

    it('should load language translations with namespace', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            key1: 'value1',
          },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse as any);

      const translations = await loader.loadLanguageNamespace(
        'en',
        'validation'
      );

      expect(translations).toEqual({ key1: 'value1' });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/translations/en/validation'
      );
    });

    it('should throw error when loading fails', async () => {
      // Use real timers - retry will fail quickly
      jest.useRealTimers();
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(loader.loadLanguageNamespace('en')).rejects.toThrow(
        I18nClientError
      );
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      loader = new I18nHttpLoader(options);
    });

    it('should return true for healthy API', async () => {
      const mockResponse = {
        status: 200,
        data: { status: 'ok' },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse as any);

      const isHealthy = await loader.healthCheck();

      expect(isHealthy).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should return false for unhealthy API', async () => {
      // Use real timers - retry will fail quickly
      jest.useRealTimers();
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection refused'));

      const isHealthy = await loader.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('retry mechanism', () => {
    beforeEach(() => {
      // Use fake timers for retry mechanism tests
      jest.useFakeTimers();
      loader = new I18nHttpLoader({
        ...options,
        retryConfig: {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
        },
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on network error', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            languages: ['en'],
          },
        },
      };

      const networkError = {
        isAxiosError: true,
        response: undefined,
        code: 'ECONNREFUSED',
      } as AxiosError;

      mockAxiosInstance.get
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockResponse as any);

      const promise = loader.languages();

      // Advance timers for retry delays
      await jest.advanceTimersByTimeAsync(100); // First retry delay
      await jest.advanceTimersByTimeAsync(200); // Second retry delay (100 * 2)

      const languages = await promise;

      expect(languages).toEqual(['en']);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx errors', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            languages: ['en'],
          },
        },
      };

      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
      } as AxiosError;

      mockAxiosInstance.get
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse as any);

      const promise = loader.languages();

      // Advance timer for retry delay
      await jest.advanceTimersByTimeAsync(100);

      const languages = await promise;

      expect(languages).toEqual(['en']);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 Too Many Requests', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            languages: ['en'],
          },
        },
      };

      const rateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          statusText: 'Too Many Requests',
        },
      } as AxiosError;

      mockAxiosInstance.get
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse as any);

      const promise = loader.languages();

      // Advance timer for retry delay
      await jest.advanceTimersByTimeAsync(100);

      const languages = await promise;

      expect(languages).toEqual(['en']);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const clientError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
        },
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(clientError);

      await expect(loader.languages()).resolves.toEqual(['en']);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            languages: ['en'],
          },
        },
      };

      const networkError = {
        isAxiosError: true,
        response: undefined,
        code: 'ECONNREFUSED',
      } as AxiosError;

      mockAxiosInstance.get
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockResponse as any);

      const promise = loader.languages();

      // Fast-forward timers for delays
      await jest.advanceTimersByTimeAsync(100); // First retry delay (baseDelay)
      await jest.advanceTimersByTimeAsync(200); // Second retry delay (baseDelay * multiplier)

      const languages = await promise;
      expect(languages).toEqual(['en']);
    });

    it('should respect max retries', async () => {
      const networkError = {
        isAxiosError: true,
        response: undefined,
        code: 'ECONNREFUSED',
      } as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(networkError);

      const promise = loader.languages();

      // Advance timers for all retry attempts
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(200); // Second retry

      // After max retries, should return fallback
      await expect(promise).resolves.toEqual(['en']);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('refreshHttpClient', () => {
    beforeEach(() => {
      loader = new I18nHttpLoader(options);
    });

    it('should reset http client', async () => {
      // Initialize client by making a request
      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: { languages: ['en'] } },
      } as any);

      await loader.languages();
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);

      loader.refreshHttpClient();

      // Make another request - should create new client
      await loader.languages();
      expect(mockedAxios.create).toHaveBeenCalledTimes(2);
    });
  });
});
