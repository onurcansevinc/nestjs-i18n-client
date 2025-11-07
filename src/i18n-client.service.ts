import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';
import { I18nHttpLoader } from './i18n-http-loader';
import { I18nClientModuleOptions } from './interfaces';
import { Injectable, Logger, Inject } from '@nestjs/common';

/**
 * Service for managing i18n translations with external API integration
 */
@Injectable()
export class I18nClientService {
  private readonly logger = new Logger(I18nClientService.name);
  private readonly loader: I18nHttpLoader;
  private isRefreshing = false;

  constructor(
    @Inject('I18N_CLIENT_OPTIONS')
    private readonly options: I18nClientModuleOptions,
    private readonly i18nService: I18nService
  ) {
    // Access the loader through I18nService's internal loader
    this.loader = (this.i18nService as any).loader as I18nHttpLoader;
  }

  /**
   * Scheduled job to refresh translations every 3 hours
   */
  @Cron('0 */3 * * *', {
    name: 'refreshTranslations',
    timeZone: 'UTC',
  })
  async refreshTranslations(): Promise<void> {
    if (this.isRefreshing) {
      this.logger.warn('Translation refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;
    this.logger.log('Starting scheduled translation refresh...');

    try {
      await this.performRefresh();
      this.logger.log('Scheduled translation refresh completed successfully');
    } catch (error) {
      this.logger.error('Scheduled translation refresh failed:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Manually trigger translation refresh
   */
  async manualRefresh(): Promise<void> {
    if (this.isRefreshing) {
      this.logger.warn('Translation refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;
    this.logger.log('Manual translation refresh triggered');

    try {
      await this.performRefresh();
      this.logger.log('Manual translation refresh completed successfully');
    } catch (error) {
      this.logger.error('Manual translation refresh failed:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Perform the actual refresh operation
   */
  private async performRefresh(): Promise<void> {
    // Check API health first
    const isHealthy = await this.loader.healthCheck();
    if (!isHealthy) {
      throw new Error('Translation API is not healthy');
    }

    // Get available languages from the API
    const languages = await this.getAvailableLanguages();

    // Refresh translations for each language
    for (const language of languages) {
      try {
        await this.refreshLanguageTranslations(language);
        this.logger.debug(`Refreshed translations for language: ${language}`);
      } catch (error) {
        this.logger.warn(
          `Failed to refresh translations for language ${language}:`,
          error
        );
      }
    }

    // Also refresh default language if specified and different
    if (
      this.options.defaultLanguage &&
      !languages.includes(this.options.defaultLanguage)
    ) {
      try {
        await this.refreshLanguageTranslations(this.options.defaultLanguage);
        this.logger.debug(
          `Refreshed translations for default language: ${this.options.defaultLanguage}`
        );
      } catch (error) {
        this.logger.warn(
          `Failed to refresh translations for default language ${this.options.defaultLanguage}:`,
          error
        );
      }
    }
  }

  /**
   * Refresh translations for a specific language
   */
  private async refreshLanguageTranslations(language: string): Promise<void> {
    try {
      // Load general translations
      const translations = await this.loader.loadLanguageNamespace(language);

      // Try to load namespace-specific translations
      const namespaces = await this.getAvailableNamespaces(language);

      for (const namespace of namespaces) {
        try {
          await this.loader.loadLanguageNamespace(language, namespace);
        } catch (error) {
          this.logger.warn(
            `Failed to load namespace ${namespace} for language ${language}:`,
            error
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to refresh translations for language ${language}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get available languages from the API
   */
  private async getAvailableLanguages(): Promise<string[]> {
    try {
      const response = await this.loader['getHttpClient']().get(
        '/translations/language'
      );
      return response.data?.languages || ['en']; // Default to English if no languages found
    } catch (error) {
      this.logger.error('Failed to get available languages:', error);
      throw error; // Re-throw error instead of returning fallback
    }
  }

  /**
   * Get available namespaces for a specific language
   */
  private async getAvailableNamespaces(language: string): Promise<string[]> {
    try {
      const response = await this.loader['getHttpClient']().get(
        `/translations/${language}`
      );
      return response.data?.namespaces || [];
    } catch (error) {
      this.logger.warn(
        `Failed to get namespaces for language ${language}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get translation for a specific key
   */
  async getTranslation(key: string, language?: string): Promise<string> {
    try {
      return this.i18nService.translate(key, {
        lang: language || this.options.defaultLanguage || 'en',
        args: {},
      });
    } catch (error) {
      this.logger.warn(`Failed to get translation for key ${key}:`, error);
      return key; // Return the key itself if translation fails
    }
  }

  /**
   * Check if the translation API is healthy
   */
  async healthCheck(): Promise<boolean> {
    return this.loader.healthCheck();
  }

  /**
   * Get current configuration
   */
  getConfig(): I18nClientModuleOptions {
    return { ...this.options };
  }

  /**
   * Check if refresh is currently in progress
   */
  isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }
}
