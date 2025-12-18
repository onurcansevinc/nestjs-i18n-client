// Main module exports
export { I18nHttpLoader } from './i18n-http-loader';
export { I18nClientModule } from './i18n-client.module';
export { I18nClientService } from './i18n-client.service';
export { generateTypesFromAPI } from './type-generator';

// Interface and type exports
export type {
  RetryConfig,
  HealthResponse,
  I18nClientError,
  TranslationData,
  ApiErrorResponse,
  TranslationResponse,
  I18nClientModuleOptions,
  I18nClientModuleAsyncOptions,
} from './interfaces';

// Re-export types from generated types file
// This enables type augmentation for nestjs-i18n
// The types.d.ts file is generated automatically on module initialization
export type { TranslationKey } from '../types';
