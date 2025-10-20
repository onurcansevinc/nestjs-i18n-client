import { DynamicModule } from '@nestjs/common';
import { I18nClientModuleOptions, I18nClientModuleAsyncOptions } from './interfaces';
/**
 * Dynamic module for I18n client functionality
 */
export declare class I18nClientModule {
    /**
     * Register the module with synchronous options
     */
    static forRoot(options: I18nClientModuleOptions): DynamicModule;
    /**
     * Register the module with asynchronous options
     */
    static forRootAsync(options: I18nClientModuleAsyncOptions): DynamicModule;
}
