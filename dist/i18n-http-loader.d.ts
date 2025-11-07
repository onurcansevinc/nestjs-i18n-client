import { I18nLoader, I18nTranslation } from 'nestjs-i18n';
import { I18nClientModuleOptions, TranslationData } from './interfaces';
/**
 * Custom HTTP loader for nestjs-i18n that fetches translations from an external API
 */
export declare class I18nHttpLoader extends I18nLoader {
    private readonly options;
    private httpClient;
    private readonly retryConfig;
    private readonly logger;
    constructor(options: I18nClientModuleOptions);
    /**
     * Lazy initialization of axios client
     */
    private getHttpClient;
    /**
     * Check if an error should be retried
     */
    private shouldRetry;
    /**
     * Calculate delay for exponential backoff
     */
    private calculateDelay;
    /**
     * Sleep utility for delays
     */
    private sleep;
    /**
     * Execute HTTP request with retry logic and exponential backoff
     */
    private executeWithRetry;
    /**
     * Manually reset the axios client (e.g., when config changes)
     */
    refreshHttpClient(): void;
    /**
     * Get available languages from API
     */
    languages(): Promise<string[]>;
    /**
     * Load all translations
     */
    load(): Promise<I18nTranslation>;
    /**
     * Fetch translations for a specific language
     */
    private fetchLanguageTranslations;
    /**
     * Load translations for a specific language + namespace
     */
    loadLanguageNamespace(language: string, namespace?: string): Promise<TranslationData>;
    /**
     * API Health Check
     */
    healthCheck(): Promise<boolean>;
    /**
     * Human-readable error formatter
     */
    private getErrorMessage;
}
