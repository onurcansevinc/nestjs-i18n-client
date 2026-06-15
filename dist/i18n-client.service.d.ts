import { I18nService } from 'nestjs-i18n';
import { I18nClientModuleOptions } from './interfaces';
import { OnModuleInit } from '@nestjs/common';
export declare class I18nClientService implements OnModuleInit {
    private readonly options;
    private readonly i18nService;
    private readonly logger;
    private readonly loader;
    private isRefreshing;
    constructor(options: I18nClientModuleOptions, i18nService: I18nService);
    private resolveLoader;
    onModuleInit(): Promise<void>;
    refreshTranslations(): Promise<void>;
    manualRefresh(): Promise<void>;
    private performRefresh;
    healthCheck(): Promise<boolean>;
    getConfig(): I18nClientModuleOptions;
    isRefreshInProgress(): boolean;
    private getErrorMessage;
}
