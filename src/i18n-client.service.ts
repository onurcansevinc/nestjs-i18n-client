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
    this.loader = this.resolveLoader();
  }

  private resolveLoader(): I18nHttpLoader {
    const i18nService = this.i18nService as any;
    const loader = i18nService.loader || i18nService.loaders?.[0];

    if (!loader) {
      throw new Error('I18nClientService: I18nHttpLoader is not available.');
    }

    return loader as I18nHttpLoader;
  }

  // Automatically generate types on module initialization
  async onModuleInit(): Promise<void> {
    if (
      this.options.disableTypeGeneration ||
      this.options.enabled === false ||
      process.env.I18N_CLIENT_SKIP_TYPES === 'true'
    ) {
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
    if (this.options.enabled === false) {
      this.logger.debug('Translation refresh disabled by configuration.');
      return;
    }

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
      this.logger.error(
        `Scheduled translation refresh failed: ${this.getErrorMessage(error)}`
      );
    } finally {
      this.isRefreshing = false;
    }
  }

  // Manually trigger translation refresh
  async manualRefresh(): Promise<void> {
    if (this.options.enabled === false) {
      this.logger.debug('Translation refresh disabled by configuration.');
      return;
    }

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
    const isHealthy = await this.loader.healthCheck();
    if (!isHealthy) {
      throw new Error('Translation API is not healthy');
    }

    const translations = await this.loader.load();
    const languages = Object.keys(translations);

    await this.i18nService.refresh(
      translations,
      languages.length ? languages : await this.loader.languages()
    );

    this.logger.debug(
      `Refreshed translations for: ${Object.keys(translations).join(', ')}`
    );
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

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.stack || error.message;
    }

    return String(error);
  }
}
