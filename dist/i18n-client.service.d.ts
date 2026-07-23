import { I18nService } from 'nestjs-i18n';
import { I18nClientModuleOptions } from './interfaces';
import { OnApplicationBootstrap, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class I18nClientService implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy {
    private readonly options;
    private readonly i18nService;
    private readonly logger;
    private readonly loader;
    private isRefreshing;
    private refreshJob?;
    constructor(options: I18nClientModuleOptions, i18nService: I18nService);
    private resolveLoader;
    onModuleInit(): Promise<void>;
    onApplicationBootstrap(): void;
    onModuleDestroy(): Promise<void>;
    refreshTranslations(): Promise<void>;
    manualRefresh(): Promise<void>;
    private performRefresh;
    healthCheck(): Promise<boolean>;
    getConfig(): I18nClientModuleOptions;
    isRefreshInProgress(): boolean;
    private getErrorMessage;
}
