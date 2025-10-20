"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nClientError = void 0;
/**
 * Custom error class for I18n client errors
 */
class I18nClientError extends Error {
    statusCode;
    originalError;
    constructor(message, statusCode, originalError) {
        super(message);
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.name = 'I18nClientError';
    }
}
exports.I18nClientError = I18nClientError;
