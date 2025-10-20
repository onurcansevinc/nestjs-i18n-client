import { I18nService } from 'nestjs-i18n';
import { I18nClientModuleOptions } from './interfaces';
/**
 * Service for managing i18n translations with external API integration
 */
export declare class I18nClientService {
    private readonly options;
    private readonly i18nService;
    private readonly logger;
    private readonly loader;
    private isRefreshing;
    constructor(options: I18nClientModuleOptions, i18nService: I18nService);
    /**
     * Scheduled job to refresh translations every 3 hours
     */
    refreshTranslations(): Promise<void>;
    /**
     * Manually trigger translation refresh
     */
    manualRefresh(): Promise<void>;
    /**
     * Perform the actual refresh operation
     */
    private performRefresh;
    /**
     * Refresh translations for a specific language
     */
    private refreshLanguageTranslations;
    /**
     * Get available languages from the API
     */
    private getAvailableLanguages;
    /**
     * Get available namespaces for a specific language
     */
    private getAvailableNamespaces;
    /**
     * Get translation for a specific key
     */
    getTranslation(key: string, language?: string): Promise<string>;
    /**
     * Check if the translation API is healthy
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get current configuration
     */
    getConfig(): I18nClientModuleOptions;
    /**
     * Check if refresh is currently in progress
     */
    isRefreshInProgress(): boolean;
}
