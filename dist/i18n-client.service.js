"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var I18nClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nClientService = void 0;
const schedule_1 = require("@nestjs/schedule");
const nestjs_i18n_1 = require("nestjs-i18n");
const type_generator_1 = require("./type-generator");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Service for managing i18n translations with external API integration
let I18nClientService = I18nClientService_1 = class I18nClientService {
    options;
    i18nService;
    logger = new common_1.Logger(I18nClientService_1.name);
    loader;
    isRefreshing = false;
    constructor(options, i18nService) {
        this.options = options;
        this.i18nService = i18nService;
        // Access the loader through I18nService's internal loader
        this.loader = this.i18nService.loader;
    }
    // Automatically generate types on module initialization
    async onModuleInit() {
        if (this.options.disableTypeGeneration || process.env.I18N_CLIENT_SKIP_TYPES === 'true') {
            this.logger.debug('Type generation disabled by configuration.');
            return;
        }
        // Skip type generation in watch mode to prevent restart loops
        // Watch mode can be detected by checking if NODE_ENV is development
        // and if the process is being watched (nest start --watch)
        const isWatchMode = process.env.NODE_ENV === 'development' &&
            (process.argv.includes('--watch') ||
                process.argv.includes('start:dev') ||
                process.env.NEST_WATCH === 'true');
        if (isWatchMode) {
            // In watch mode, only generate types if file doesn't exist
            // This prevents unnecessary file writes that trigger restarts
            try {
                const packagePath = require.resolve('nestjs-i18n-client/package.json');
                const typesPath = path.join(path.dirname(packagePath), 'types.d.ts');
                if (fs.existsSync(typesPath)) {
                    this.logger.debug('Watch mode detected: Skipping type generation (types already exist)');
                    return;
                }
            }
            catch (error) {
                // If we can't resolve the package path, continue with generation
                // This might happen in some edge cases
            }
        }
        // Generate types in the background (non-blocking)
        // This will create types.d.ts in node_modules/nestjs-i18n-client/
        // The generator function now checks content before writing to avoid unnecessary file changes
        (0, type_generator_1.generateTypesFromAPI)(this.options).catch((error) => {
            this.logger.warn(`Failed to generate TypeScript types: ${error.message}. Types will not be available for autocomplete.`);
        });
    }
    // Scheduled job to refresh translations every 3 hours
    async refreshTranslations() {
        if (this.isRefreshing) {
            this.logger.warn('Translation refresh already in progress, skipping...');
            return;
        }
        this.isRefreshing = true;
        this.logger.log('Starting scheduled translation refresh...');
        try {
            await this.performRefresh();
            this.logger.log('Scheduled translation refresh completed successfully');
        }
        catch (error) {
            this.logger.error('Scheduled translation refresh failed:', error);
        }
        finally {
            this.isRefreshing = false;
        }
    }
    // Manually trigger translation refresh
    async manualRefresh() {
        if (this.isRefreshing) {
            this.logger.warn('Translation refresh already in progress, skipping...');
            return;
        }
        this.isRefreshing = true;
        this.logger.log('Manual translation refresh triggered');
        try {
            await this.performRefresh();
            this.logger.log('Manual translation refresh completed successfully');
        }
        catch (error) {
            this.logger.error('Manual translation refresh failed:', error);
            throw error;
        }
        finally {
            this.isRefreshing = false;
        }
    }
    // Perform the actual refresh operation
    async performRefresh() {
        // Check API health first
        const isHealthy = await this.loader.healthCheck();
        if (!isHealthy) {
            throw new Error('Translation API is not healthy');
        }
        // Get available languages from the API
        const languages = await this.getAvailableLanguages();
        // Refresh translations for each language
        for (const language of languages) {
            try {
                await this.loader.load();
                this.logger.debug(`Refreshed translations for language: ${language}`);
            }
            catch (error) {
                this.logger.warn(`Failed to refresh translations for language ${language}:`, error);
            }
        }
        // Also refresh default language if specified and different
        if (this.options.defaultLanguage &&
            !languages.includes(this.options.defaultLanguage)) {
            try {
                await this.loader.load();
                this.logger.debug(`Refreshed translations for default language: ${this.options.defaultLanguage}`);
            }
            catch (error) {
                this.logger.warn(`Failed to refresh translations for default language ${this.options.defaultLanguage}:`, error);
            }
        }
    }
    // Get available languages from the API
    async getAvailableLanguages() {
        try {
            const category = this.options.category || 'web';
            const url = `/translations/language?category=${category}`;
            const response = await this.loader['getHttpClient']().get(url);
            return response.data?.languages || ['en']; // Default to English if no languages found
        }
        catch (error) {
            this.logger.error('Failed to get available languages:', error);
            throw error; // Re-throw error instead of returning fallback
        }
    }
    // Check if the translation API is healthy
    async healthCheck() {
        return this.loader.healthCheck();
    }
    // Get current configuration
    getConfig() {
        return { ...this.options };
    }
    // Check if refresh is currently in progress
    isRefreshInProgress() {
        return this.isRefreshing;
    }
};
exports.I18nClientService = I18nClientService;
__decorate([
    (0, schedule_1.Cron)('0 */3 * * *', {
        name: 'refreshTranslations',
        timeZone: 'UTC',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], I18nClientService.prototype, "refreshTranslations", null);
exports.I18nClientService = I18nClientService = I18nClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('I18N_CLIENT_OPTIONS')),
    __metadata("design:paramtypes", [Object, nestjs_i18n_1.I18nService])
], I18nClientService);
