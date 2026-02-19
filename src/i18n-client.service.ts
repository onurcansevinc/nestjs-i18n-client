import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';
import { I18nHttpLoader } from './i18n-http-loader';
import { I18nClientModuleOptions } from './interfaces';
import { generateTypesFromAPI } from './type-generator';
import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Service for managing i18n translations with external API integration
@Injectable()
export class I18nClientService implements OnModuleInit {
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

  // Automatically generate types on module initialization
  async onModuleInit(): Promise<void> {
    if (this.options.disableTypeGeneration || process.env.I18N_CLIENT_SKIP_TYPES === 'true') {
      this.logger.debug('Type generation disabled by configuration.');
      return;
    }

    // Skip type generation in watch mode to prevent restart loops
    // Watch mode can be detected by checking if NODE_ENV is development
    // and if the process is being watched (nest start --watch)
    const isWatchMode =
      process.env.NODE_ENV === 'development' &&
      (process.argv.includes('--watch') ||
        process.argv.includes('start:dev') ||
        process.env.NEST_WATCH === 'true');

    if (isWatchMode) {
      // In watch mode, only generate types if file doesn't exist
      // This prevents unnecessary file writes that trigger restarts
      try {
        const packagePath = require.resolve('nestjs-i18n-client/package.json');
        const typesPath = path.join(path.dirname(packagePath), 'types.d.ts');

        if (fs.existsSync(typesPath)) {
          this.logger.debug(
            'Watch mode detected: Skipping type generation (types already exist)'
          );
          return;
        }
      } catch (error) {
        // If we can't resolve the package path, continue with generation
        // This might happen in some edge cases
      }
    }

    // Generate types in the background (non-blocking)
    // This will create types.d.ts in node_modules/nestjs-i18n-client/
    // The generator function now checks content before writing to avoid unnecessary file changes
    generateTypesFromAPI(this.options).catch((error) => {
      this.logger.warn(
        `Failed to generate TypeScript types: ${error.message}. Types will not be available for autocomplete.`
      );
    });
  }

  // Scheduled job to refresh translations every 3 hours
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

  // Manually trigger translation refresh
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

  // Perform the actual refresh operation
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
        await this.loader.load();
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
        await this.loader.load();
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

  // Get available languages from the API
  private async getAvailableLanguages(): Promise<string[]> {
    try {
      const category = this.options.category || 'web';
      const url = `/translations/language?category=${category}`;
      const response = await this.loader['getHttpClient']().get(url);
      return response.data?.languages || ['en']; // Default to English if no languages found
    } catch (error) {
      this.logger.error('Failed to get available languages:', error);
      throw error; // Re-throw error instead of returning fallback
    }
  }

  // Check if the translation API is healthy
  async healthCheck(): Promise<boolean> {
    return this.loader.healthCheck();
  }

  // Get current configuration
  getConfig(): I18nClientModuleOptions {
    return { ...this.options };
  }

  // Check if refresh is currently in progress
  isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }
}
