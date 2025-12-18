/**
 * Type helpers for type-safe translation keys
 *
 * Usage:
 * 1. Generate types: npm run generate:types -- --api-url <url> --api-key <key>
 * 2. Import TranslationKeys from your generated i18n-translations.d.ts
 * 3. Use with I18nService for type-safe translations
 *
 * Note: TranslationKeys type should be imported directly from your generated
 * i18n-translations.d.ts file, not from this module.
 */
/**
 * Type-safe wrapper for I18nService.t() method
 *
 * Example:
 * ```typescript
 * import { TranslationKeys } from './i18n-translations';
 * import { I18nService } from 'nestjs-i18n';
 *
 * class MyService {
 *   constructor(private readonly i18n: I18nService) {}
 *
 *   getMessage(key: TranslationKeys) {
 *     return this.i18n.t(key);
 *   }
 * }
 * ```
 */
export type TypedI18nKey<T extends string = string> = T;
