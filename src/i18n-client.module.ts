import { ScheduleModule } from '@nestjs/schedule';
import { I18nHttpLoader } from './i18n-http-loader';
import { I18nClientService } from './i18n-client.service';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  HeaderResolver,
  AcceptLanguageResolver,
  I18nModule,
} from 'nestjs-i18n';
import {
  I18nClientModuleOptions,
  I18nClientModuleAsyncOptions,
} from './interfaces';

/**
 * Dynamic module for I18n client functionality
 */
@Module({})
export class I18nClientModule {
  /**
   * Register the module with synchronous options
   */
  static forRoot(options: I18nClientModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'I18N_CLIENT_OPTIONS',
        useValue: options,
      },
      I18nClientService,
    ];

    return {
      module: I18nClientModule,
      imports: [
        ScheduleModule.forRoot(),
        I18nModule.forRoot({
          fallbackLanguage: options.defaultLanguage || 'en',
          loader: I18nHttpLoader,
          loaderOptions: options,
          resolvers: [
            new HeaderResolver(['x-custom-lang']),
            AcceptLanguageResolver,
          ],
        }),
      ],
      providers,
      exports: [I18nClientService],
      global: true,
    };
  }

  /**
   * Register the module with asynchronous options
   */
  static forRootAsync(options: I18nClientModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'I18N_CLIENT_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      I18nClientService,
    ];

    return {
      module: I18nClientModule,
      imports: [
        ScheduleModule.forRoot(),
        ...(options.imports || []),
        I18nModule.forRootAsync({
          useFactory: async (...args: any[]) => {
            const clientOptions = await options.useFactory(...args);
            return {
              fallbackLanguage: clientOptions.defaultLanguage || 'en',
              loader: I18nHttpLoader,
              loaderOptions: clientOptions,
            };
          },
          inject: options.inject || [],
          resolvers: [
            new HeaderResolver(['x-custom-lang']),
            AcceptLanguageResolver,
          ],
        }),
      ],
      providers,
      exports: [I18nClientService],
      global: true,
    };
  }
}
