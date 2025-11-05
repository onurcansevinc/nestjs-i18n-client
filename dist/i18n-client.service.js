"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const common_1 = require("@nestjs/common");
/**
 * Service for managing i18n translations with external API integration
 */
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
    /**
     * Scheduled job to refresh translations every 3 hours
     */
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
    /**
     * Manually trigger translation refresh
     */
    async manualRefresh() {
        this.logger.log('Manual translation refresh triggered');
        try {
            await this.performRefresh();
            this.logger.log('Manual translation refresh completed successfully');
        }
        catch (error) {
            this.logger.error('Manual translation refresh failed:', error);
            throw error;
        }
    }
    /**
     * Perform the actual refresh operation
     */
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
                await this.refreshLanguageTranslations(language);
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
                await this.refreshLanguageTranslations(this.options.defaultLanguage);
                this.logger.debug(`Refreshed translations for default language: ${this.options.defaultLanguage}`);
            }
            catch (error) {
                this.logger.warn(`Failed to refresh translations for default language ${this.options.defaultLanguage}:`, error);
            }
        }
    }
    /**
     * Refresh translations for a specific language
     */
    async refreshLanguageTranslations(language) {
        try {
            // Load general translations
            const translations = await this.loader.loadLanguageNamespace(language);
            // Try to load namespace-specific translations
            const namespaces = await this.getAvailableNamespaces(language);
            for (const namespace of namespaces) {
                try {
                    await this.loader.loadLanguageNamespace(language, namespace);
                }
                catch (error) {
                    this.logger.warn(`Failed to load namespace ${namespace} for language ${language}:`, error);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to refresh translations for language ${language}:`, error);
            throw error;
        }
    }
    /**
     * Get available languages from the API
     */
    async getAvailableLanguages() {
        try {
            const response = await this.loader['getHttpClient']().get('/translations/language');
            return response.data?.languages || ['en']; // Default to English if no languages found
        }
        catch (error) {
            this.logger.warn('Failed to get available languages, using default:', error);
            return [this.options.defaultLanguage || 'en'];
        }
    }
    /**
     * Get available namespaces for a specific language
     */
    async getAvailableNamespaces(language) {
        try {
            const response = await this.loader['getHttpClient']().get(`/translations/${language}`);
            return response.data?.namespaces || [];
        }
        catch (error) {
            this.logger.warn(`Failed to get namespaces for language ${language}:`, error);
            return [];
        }
    }
    /**
     * Get translation for a specific key
     */
    async getTranslation(key, language) {
        try {
            return this.i18nService.translate(key, {
                lang: language || this.options.defaultLanguage || 'en',
                args: {},
            });
        }
        catch (error) {
            this.logger.warn(`Failed to get translation for key ${key}:`, error);
            return key; // Return the key itself if translation fails
        }
    }
    /**
     * Check if the translation API is healthy
     */
    async healthCheck() {
        return this.loader.healthCheck();
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.options };
    }
    /**
     * Check if refresh is currently in progress
     */
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
