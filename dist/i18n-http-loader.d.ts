import { I18nLoader, I18nTranslation } from 'nestjs-i18n';
import { I18nClientModuleOptions } from './interfaces';
export declare class I18nHttpLoader extends I18nLoader {
    private readonly options;
    private httpClient;
    private readonly retryConfig;
    private readonly logger;
    constructor(options: I18nClientModuleOptions);
    private getHttpClient;
    private shouldRetry;
    private calculateDelay;
    private sleep;
    private executeWithRetry;
    refreshHttpClient(): void;
    languages(): Promise<string[]>;
    load(): Promise<I18nTranslation>;
    private fetchLanguageTranslations;
    healthCheck(): Promise<boolean>;
    private getErrorMessage;
}
