"use strict";
/**
 * Type generator utility for generating TypeScript types from API translations
 * This is used internally by the module to generate types at runtime
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTypesFromAPI = generateTypesFromAPI;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Extract all keys from nested translation object
function extractKeys(obj, prefix = '') {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recursively extract keys from nested objects
            keys.push(...extractKeys(value, fullKey));
        }
        else {
            // Leaf node - this is a translation key
            keys.push(fullKey);
        }
    }
    return keys;
}
// Convert keys to TypeScript union type
function generateTypeDefinition(keys) {
    if (keys.length === 0) {
        return `export type TranslationKey = string;`;
    }
    // Sort keys for better readability
    const sortedKeys = [...keys].sort();
    // Generate union type
    const typeDefinition = sortedKeys.map((key) => `  | '${key}'`).join('\n');
    return `export type TranslationKey =
${typeDefinition};
`;
}
// Generate module augmentation for nestjs-i18n
function generateModuleAugmentation() {
    return `
// Module augmentation for nestjs-i18n I18nService
// This extends the I18nService.t() method with type-safe autocomplete
declare module 'nestjs-i18n' {
  interface I18nService {
    /**
     * Translate a key with type-safe autocomplete
     * @param key - Translation key (autocomplete supported)
     * @param options - Translation options
     */
    t(key: TranslationKey, options?: any): string;
  }
}
`;
}
// Fetch translations from API
async function fetchTranslations(httpClient, language, category) {
    try {
        const response = await httpClient.get(`/translations?category=${category}&language=${language}`);
        if (!response.data.success) {
            throw new Error('API returned unsuccessful response');
        }
        return response.data.data || {};
    }
    catch (error) {
        throw new Error(`Failed to fetch translations: ${error.message || 'Unknown error'}`);
    }
}
/**
 * Generate TypeScript type definitions from API translations
 * @param options - Module options containing API configuration
 * @param outputPath - Optional output path (defaults to dist/types.d.ts)
 */
async function generateTypesFromAPI(options, outputPath) {
    const { apiUrl, apiKey, category = 'web', defaultLanguage = 'en' } = options;
    // Default output path is in node_modules/nestjs-i18n-client/
    // This ensures types are available for autocomplete without user intervention
    // Try to find the package location first
    let packagePath = path.join(process.cwd(), 'node_modules', 'nestjs-i18n-client');
    // If not found, try to resolve from require.resolve
    try {
        // Use a try-catch to handle cases where the package might not be installed yet
        const packageJsonPath = require.resolve('nestjs-i18n-client/package.json');
        packagePath = path.dirname(packageJsonPath);
    }
    catch (error) {
        // Fallback to node_modules path - this is fine, the directory will be created if needed
    }
    const finalOutputPath = outputPath || path.join(packagePath, 'types.d.ts');
    // Create HTTP client
    const httpClient = axios_1.default.create({
        baseURL: apiUrl,
        timeout: 30000,
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
        },
    });
    try {
        // Fetch translations
        const translations = await fetchTranslations(httpClient, defaultLanguage, category);
        // Extract all keys
        const keys = extractKeys(translations);
        if (keys.length === 0) {
            // Generate fallback type if no keys found
            const fallbackContent = `/**
 * Auto-generated TypeScript types for nestjs-i18n-client
 * 
 * This file is automatically generated. Do not edit manually.
 * Last generated: ${new Date().toISOString()}
 * 
 * Note: No translation keys found. Using fallback type.
 */

export type TranslationKey = string;
${generateModuleAugmentation()}
`;
            // Ensure output directory exists
            const outputDir = path.dirname(finalOutputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            // Check if file exists and content is the same to avoid unnecessary writes
            if (fs.existsSync(finalOutputPath)) {
                const existingContent = fs.readFileSync(finalOutputPath, 'utf-8');
                const existingContentNormalized = existingContent.replace(/Last generated: [^\n]*/g, '');
                const newContentNormalized = fallbackContent.replace(/Last generated: [^\n]*/g, '');
                if (existingContentNormalized === newContentNormalized) {
                    return; // Skip write to avoid triggering watch mode
                }
            }
            fs.writeFileSync(finalOutputPath, fallbackContent, 'utf-8');
            return;
        }
        // Generate type definition
        const typeDefinition = generateTypeDefinition(keys);
        const moduleAugmentation = generateModuleAugmentation();
        // Combine into final file content
        const fileContent = `/**
 * Auto-generated TypeScript types for nestjs-i18n-client
 * 
 * This file is automatically generated. Do not edit manually.
 * Last generated: ${new Date().toISOString()}
 * 
 * Generated from ${keys.length} translation keys.
 */

${typeDefinition}
${moduleAugmentation}
`;
        // Ensure output directory exists
        const outputDir = path.dirname(finalOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Check if file exists and content is the same to avoid unnecessary writes
        // This prevents watch mode from triggering restarts
        if (fs.existsSync(finalOutputPath)) {
            const existingContent = fs.readFileSync(finalOutputPath, 'utf-8');
            // Compare content (excluding timestamp in comments)
            const existingContentNormalized = existingContent.replace(/Last generated: [^\n]*/g, '');
            const newContentNormalized = fileContent.replace(/Last generated: [^\n]*/g, '');
            // Only write if content actually changed
            if (existingContentNormalized === newContentNormalized) {
                // Content is the same, skip write to avoid triggering watch mode
                return;
            }
        }
        // Write file only if content changed or file doesn't exist
        fs.writeFileSync(finalOutputPath, fileContent, 'utf-8');
    }
    catch (error) {
        // Don't throw - just log warning
        console.warn(`[nestjs-i18n-client] Failed to generate types: ${error.message}`);
    }
}
