import { DynamicModule } from '@nestjs/common';
import { I18nClientModuleOptions, I18nClientModuleAsyncOptions } from './interfaces';
export declare class I18nClientModule {
    static forRoot(options: I18nClientModuleOptions): DynamicModule;
    static forRootAsync(options: I18nClientModuleAsyncOptions): DynamicModule;
}
