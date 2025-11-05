import axios, { AxiosInstance } from 'axios';
import { Inject, Logger } from '@nestjs/common';
import { I18nLoader, I18N_LOADER_OPTIONS, I18nTranslation } from 'nestjs-i18n';
import {
  I18nClientModuleOptions,
  RetryConfig,
  TranslationData,
  I18nClientError,
} from './interfaces';

/**
 * Custom HTTP loader for nestjs-i18n that fetches translations from an external API
 */
export class I18nHttpLoader extends I18nLoader {
  private httpClient: AxiosInstance | null = null;
  private readonly retryConfig: Required<RetryConfig>;
  private readonly logger = new Logger(I18nHttpLoader.name);

  constructor(
    @Inject(I18N_LOADER_OPTIONS)
    private readonly options: I18nClientModuleOptions
  ) {
    super();

    if (!options?.apiUrl || !options?.bearerToken) {
      this.logger.warn(
        'I18nHttpLoader: No valid options provided. HTTP client will not initialize.'
      );
    }

    this.retryConfig = {
      maxRetries: options?.retryConfig?.maxRetries ?? 3,
      baseDelay: options?.retryConfig?.baseDelay ?? 1000,
      maxDelay: options?.retryConfig?.maxDelay ?? 10000,
      backoffMultiplier: options?.retryConfig?.backoffMultiplier ?? 2,
    };
  }

  /**
   * Lazy initialization of axios client
   */
  private getHttpClient(): AxiosInstance {
    if (!this.httpClient) {
      if (!this.options?.apiUrl || !this.options?.bearerToken) {
        throw new Error('I18nHttpLoader: Missing apiUrl or bearerToken.');
      }

      this.httpClient = axios.create({
        baseURL: this.options.apiUrl,
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${this.options.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Log failed responses with more context
      this.httpClient.interceptors.response.use(
        (res) => res,
        (error) => {
          const msg = this.getErrorMessage(error);
          this.logger.error(
            `Request failed [${error.config?.method?.toUpperCase()} ${
              error.config?.url
            }] (${msg})`
          );
          return Promise.reject(error);
        }
      );
    }

    return this.httpClient;
  }

  /**
   * Manually reset the axios client (e.g., when config changes)
   */
  refreshHttpClient(): void {
    this.httpClient = null;
  }

  /**
   * Get available languages from API
   */
  async languages(): Promise<string[]> {
    try {
      const res = await this.getHttpClient().get('/translations/language');
      if (!res.data.success) return [this.options.defaultLanguage || 'en'];
      return res.data.data.languages || [this.options.defaultLanguage || 'en'];
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.logger.warn(`Failed to fetch languages (${msg}), using fallback.`);
      return [this.options.defaultLanguage || 'en'];
    }
  }

  /**
   * Load all translations
   */
  async load(): Promise<I18nTranslation> {
    try {
      const langs = await this.languages();
      const translations: I18nTranslation = {};

      for (const lang of langs) {
        translations[lang] = await this.fetchLanguageTranslations(lang);
      }

      this.logger.log(
        `Loaded translations for: ${Object.keys(translations).join(', ')}`
      );

      return translations;
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.logger.error(`Failed to load translations (${msg})`);

      throw new I18nClientError(
        'Failed to load translations',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Fetch translations for a specific language
   */
  private async fetchLanguageTranslations(
    language: string
  ): Promise<Record<string, any>> {
    try {
      const res = await this.getHttpClient().get(`/translations/${language}`);
      if (!res.data.success) return {};
      return res.data.data || {};
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.logger.warn(`Failed to load '${language}' (${msg})`);
      return {};
    }
  }

  /**
   * Load translations for a specific language + namespace
   */
  async loadLanguageNamespace(
    language: string,
    namespace?: string
  ): Promise<TranslationData> {
    const key = namespace ? `${language}:${namespace}` : language;

    try {
      const url = namespace
        ? `/translations/${language}/${namespace}`
        : `/translations/${language}`;

      const res = await this.getHttpClient().get(url);
      if (!res.data.success) return {};
      const data = res.data.data || {};

      this.logger.log(`Loaded translations for: ${key}`);

      return data;
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.logger.error(`Failed to load '${key}' (${msg})`);

      throw new I18nClientError(
        `Failed to load ${key}`,
        undefined,
        error as Error
      );
    }
  }

  /**
   * API Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.getHttpClient().get('/health');
      return res.status >= 200 && res.status < 300;
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.logger.error(`Health check failed (${msg})`);
      return false;
    }
  }

  /**
   * Human-readable error formatter
   */
  private getErrorMessage(error: any): string {
    if (error?.isAxiosError) {
      if (error.code === 'ECONNREFUSED')
        return `Connection refused (${error.config?.baseURL})`;
      if (error.code === 'ENOTFOUND')
        return `Host not found (${error.config?.baseURL})`;
      if (error.code === 'ETIMEDOUT')
        return `Request timeout (${error.config?.timeout}ms)`;
      if (error.response)
        return `HTTP ${error.response.status}: ${error.response.statusText}`;
      if (error.request) return `Network error (${error.code || 'Unknown'})`;
      return error.message || 'Unknown axios error';
    }
    return error?.message || 'Unknown error';
  }
}
