import { ModuleMetadata } from '@nestjs/common';

/**
 * Configuration options for the I18nClientModule
 */
export interface I18nClientModuleOptions {
  /**
   * Base URL of the translation API
   */
  apiUrl: string;

  /**
   * Bearer token for API authentication
   */
  bearerToken: string;

  /**
   * Default language code (optional)
   */
  defaultLanguage?: string;

  /**
   * Retry configuration for failed requests
   */
  retryConfig?: RetryConfig;
}

/**
 * Async configuration factory for the I18nClientModule
 */
export interface I18nClientModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<I18nClientModuleOptions> | I18nClientModuleOptions;
  inject?: any[];
}

/**
 * Retry configuration for API requests
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;

  /**
   * Base delay between retries in milliseconds
   */
  baseDelay?: number;

  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelay?: number;

  /**
   * Backoff multiplier for exponential backoff
   */
  backoffMultiplier?: number;
}

/**
 * Translation data structure
 */
export interface TranslationData {
  [key: string]: any;
}

/**
 * API response structure for translations
 */
export interface TranslationResponse {
  language: string;
  namespace?: string;
  translations: TranslationData;
  lastModified?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Custom error class for I18n client errors
 */
export class I18nClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'I18nClientError';
  }
}
