"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var I18nClientModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nClientModule = void 0;
const schedule_1 = require("@nestjs/schedule");
const i18n_http_loader_1 = require("./i18n-http-loader");
const i18n_client_service_1 = require("./i18n-client.service");
const common_1 = require("@nestjs/common");
const nestjs_i18n_1 = require("nestjs-i18n");
/**
 * Dynamic module for I18n client functionality
 */
let I18nClientModule = I18nClientModule_1 = class I18nClientModule {
    /**
     * Register the module with synchronous options
     */
    static forRoot(options) {
        const providers = [
            {
                provide: 'I18N_CLIENT_OPTIONS',
                useValue: options,
            },
            i18n_client_service_1.I18nClientService,
        ];
        return {
            module: I18nClientModule_1,
            imports: [
                schedule_1.ScheduleModule.forRoot(),
                nestjs_i18n_1.I18nModule.forRoot({
                    fallbackLanguage: options.defaultLanguage || 'en',
                    loader: i18n_http_loader_1.I18nHttpLoader,
                    loaderOptions: options,
                    resolvers: [
                        new nestjs_i18n_1.HeaderResolver(['x-custom-lang']),
                        nestjs_i18n_1.AcceptLanguageResolver,
                    ],
                }),
            ],
            providers,
            exports: [i18n_client_service_1.I18nClientService],
            global: true,
        };
    }
    /**
     * Register the module with asynchronous options
     */
    static forRootAsync(options) {
        const providers = [
            {
                provide: 'I18N_CLIENT_OPTIONS',
                useFactory: options.useFactory,
                inject: options.inject || [],
            },
            i18n_client_service_1.I18nClientService,
        ];
        return {
            module: I18nClientModule_1,
            imports: [
                schedule_1.ScheduleModule.forRoot(),
                ...(options.imports || []),
                nestjs_i18n_1.I18nModule.forRootAsync({
                    useFactory: async (...args) => {
                        const clientOptions = await options.useFactory(...args);
                        return {
                            fallbackLanguage: clientOptions.defaultLanguage || 'en',
                            loader: i18n_http_loader_1.I18nHttpLoader,
                            loaderOptions: clientOptions,
                        };
                    },
                    inject: options.inject || [],
                    resolvers: [
                        new nestjs_i18n_1.HeaderResolver(['x-custom-lang']),
                        nestjs_i18n_1.AcceptLanguageResolver,
                    ],
                }),
            ],
            providers,
            exports: [i18n_client_service_1.I18nClientService],
            global: true,
        };
    }
};
exports.I18nClientModule = I18nClientModule;
exports.I18nClientModule = I18nClientModule = I18nClientModule_1 = __decorate([
    (0, common_1.Module)({})
], I18nClientModule);
