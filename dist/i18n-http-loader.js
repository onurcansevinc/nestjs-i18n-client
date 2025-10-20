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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var I18nHttpLoader_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nHttpLoader = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const nestjs_i18n_1 = require("nestjs-i18n");
const interfaces_1 = require("./interfaces");
/**
 * Custom HTTP loader for nestjs-i18n that fetches translations from an external API
 */
let I18nHttpLoader = I18nHttpLoader_1 = class I18nHttpLoader extends nestjs_i18n_1.I18nLoader {
    options;
    httpClient = null;
    retryConfig;
    logger = new common_1.Logger(I18nHttpLoader_1.name);
    constructor(options) {
        super();
        this.options = options;
        if (!options?.apiUrl || !options?.bearerToken) {
            this.logger.warn('I18nHttpLoader: No valid options provided. HTTP client will not initialize.');
        }
        this.retryConfig = {
            maxRetries: options?.retryConfig?.maxRetries ?? 3,
            baseDelay: options?.retryConfig?.baseDelay ?? 1000,
            maxDelay: options?.retryConfig?.maxDelay ?? 10000,
            backoffMultiplier: options?.retryConfig?.backoffMultiplier ?? 2,
        };
    }
    /**
     * Lazy initialization of axios client
     */
    getHttpClient() {
        if (!this.httpClient) {
            if (!this.options?.apiUrl || !this.options?.bearerToken) {
                throw new Error('I18nHttpLoader: Missing apiUrl or bearerToken.');
            }
            this.httpClient = axios_1.default.create({
                baseURL: this.options.apiUrl,
                timeout: 30000,
                headers: {
                    Authorization: `Bearer ${this.options.bearerToken}`,
                    'Content-Type': 'application/json',
                },
            });
            // Log failed responses with more context
            this.httpClient.interceptors.response.use((res) => res, (error) => {
                const msg = this.getErrorMessage(error);
                this.logger.error(`Request failed [${error.config?.method?.toUpperCase()} ${error.config?.url}] (${msg})`);
                return Promise.reject(error);
            });
        }
        return this.httpClient;
    }
    /**
     * Manually reset the axios client (e.g., when config changes)
     */
    refreshHttpClient() {
        this.httpClient = null;
    }
    /**
     * Get available languages from API
     */
    async languages() {
        try {
            const res = await this.getHttpClient().get('/translations');
            return res.data?.languages || [this.options.defaultLanguage || 'en'];
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.warn(`Failed to fetch languages (${msg}), using fallback.`);
            return [this.options.defaultLanguage || 'en'];
        }
    }
    /**
     * Load all translations
     */
    async load() {
        try {
            const langs = await this.languages();
            const translations = {};
            for (const lang of langs) {
                translations[lang] = await this.fetchLanguageTranslations(lang);
            }
            this.logger.log(`Loaded translations for: ${Object.keys(translations).join(', ')}`);
            return translations;
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.error(`Failed to load translations (${msg})`);
            throw new interfaces_1.I18nClientError('Failed to load translations', undefined, error);
        }
    }
    /**
     * Fetch translations for a specific language
     */
    async fetchLanguageTranslations(language) {
        try {
            const res = await this.getHttpClient().get(`/translations/${language}`);
            return res.data?.translations || res.data || {};
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.warn(`Failed to load '${language}' (${msg})`);
            return {};
        }
    }
    /**
     * Load translations for a specific language + namespace
     */
    async loadLanguageNamespace(language, namespace) {
        const key = namespace ? `${language}:${namespace}` : language;
        try {
            const url = namespace
                ? `/translations/${language}/${namespace}`
                : `/translations/${language}`;
            const res = await this.getHttpClient().get(url);
            const data = res.data?.translations || res.data || {};
            this.logger.log(`Loaded translations for: ${key}`);
            return data;
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.error(`Failed to load '${key}' (${msg})`);
            throw new interfaces_1.I18nClientError(`Failed to load ${key}`, undefined, error);
        }
    }
    /**
     * API Health Check
     */
    async healthCheck() {
        try {
            const res = await this.getHttpClient().get('/health');
            return res.status >= 200 && res.status < 300;
        }
        catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.error(`Health check failed (${msg})`);
            return false;
        }
    }
    /**
     * Human-readable error formatter
     */
    getErrorMessage(error) {
        if (error?.isAxiosError) {
            if (error.code === 'ECONNREFUSED')
                return `Connection refused (${error.config?.baseURL})`;
            if (error.code === 'ENOTFOUND')
                return `Host not found (${error.config?.baseURL})`;
            if (error.code === 'ETIMEDOUT')
                return `Request timeout (${error.config?.timeout}ms)`;
            if (error.response)
                return `HTTP ${error.response.status}: ${error.response.statusText}`;
            if (error.request)
                return `Network error (${error.code || 'Unknown'})`;
            return error.message || 'Unknown axios error';
        }
        return error?.message || 'Unknown error';
    }
};
exports.I18nHttpLoader = I18nHttpLoader;
exports.I18nHttpLoader = I18nHttpLoader = I18nHttpLoader_1 = __decorate([
    __param(0, (0, common_1.Inject)(nestjs_i18n_1.I18N_LOADER_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], I18nHttpLoader);
