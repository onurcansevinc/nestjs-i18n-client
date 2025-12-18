/**
 * Type generator utility for generating TypeScript types from API translations
 * This is used internally by the module to generate types at runtime
 */
import { I18nClientModuleOptions } from './interfaces';
/**
 * Generate TypeScript type definitions from API translations
 * @param options - Module options containing API configuration
 * @param outputPath - Optional output path (defaults to dist/types.d.ts)
 */
export declare function generateTypesFromAPI(options: I18nClientModuleOptions, outputPath?: string): Promise<void>;
