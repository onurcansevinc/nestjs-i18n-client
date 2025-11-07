# nestjs-i18n-client

A NestJS module built on top of `nestjs-i18n` that adds dynamic translation loading from external APIs. This package extends the powerful `nestjs-i18n` library with automatic translation caching, scheduled updates, and robust error handling with retry mechanisms.

## Features

- 🏗️ **Built on nestjs-i18n**: Extends the popular `nestjs-i18n` library with additional capabilities
- 🔄 **Dynamic Translation Loading**: Fetch translations from external APIs
- ⏰ **Scheduled Updates**: Automatic refresh every 3 hours using `nestjs-schedule`
- 🔐 **API Key Authentication**: Secure API communication
- 🔁 **Retry & Backoff**: Robust error handling with exponential backoff
- 🏥 **Health Checks**: API health monitoring
- 📦 **TypeScript Support**: Full TypeScript definitions included
- 🧪 **Testing Support**: Easy testing configuration

## Installation

```bash
npm install nestjs-i18n-client
```

## Peer Dependencies

This package requires the following peer dependencies to be installed in your project:

```bash
npm install @nestjs/common @nestjs/core @nestjs/schedule nestjs-i18n rxjs reflect-metadata class-validator class-transformer
```

**Compatible Versions**:

- `@nestjs/common`: >=10.0.0
- `@nestjs/core`: >=10.0.0
- `@nestjs/schedule`: >=4.0.0
- `nestjs-i18n`: >=9.0.0
- `rxjs`: >=7.0.0
- `reflect-metadata`: >=0.1.13
- `class-validator`: >=0.13.0
- `class-transformer`: >=0.4.0

**Important**:

- Make sure to install `reflect-metadata` as it's required for NestJS decorators to work properly
- The package uses CommonJS format for maximum compatibility with NestJS projects
- All runtime dependencies are properly declared as peerDependencies to avoid version conflicts
- Version ranges are flexible to support different NestJS versions (10.x, 11.x, etc.)

## Quick Start

### 1. Basic Configuration

```typescript
import { Module } from '@nestjs/common';
import { I18nClientModule } from 'nestjs-i18n-client';

@Module({
  imports: [
    I18nClientModule.forRoot({
      apiUrl: 'https://your-api.com',
      apiKey: 'your-api-key',
      defaultLanguage: 'en',
    }),
  ],
})
export class AppModule {}
```

**Default Resolvers**: The module automatically configures:

- `HeaderResolver` with `x-custom-lang` header
- `AcceptLanguageResolver` for browser language detection

### 2. Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { I18nClientModule } from 'nestjs-i18n-client';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    I18nClientModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        apiUrl: configService.get('I18N_API_URL'),
        apiKey: configService.get('I18N_API_KEY'),
        defaultLanguage: configService.get('I18N_DEFAULT_LANGUAGE', 'en'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 3. Using the Service

```typescript
import { I18nService } from 'nestjs-i18n';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  constructor(private readonly i18nClient: I18nService) {}

  async getMessage() {
    // Get translation
    const message = this.i18nService.t('validation.is_required');
    return message;
  }
}
```

## API Endpoints

The module expects your API to provide the following endpoints:

### Health Check

```
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### Get All Languages

```
GET /translations/language
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2025-10-22T06:31:14.664Z",
  "message": "Languages fetched successfully",
  "data": {
    "languages": ["tr", "en", "de"],
    "totalLanguages": 3
  }
}
```

### Get All Translations

```
GET /translations
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2025-10-22T06:31:46.058Z",
  "data": {
    "EN": {
      "validation.is_required": "This field is required"
    },
    "TR": {
      "validation.is_required": "Bu alan zorunludur"
    }
  }
}
```

### Get Language Translations

```
GET /translations/:language/
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2025-10-22T06:32:52.116Z",
  "data": {
    "validation.is_required": "This field is required"
  }
}
```

### Get Translations by Language and Namespace

```
GET /translations/:language/:namespace
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2025-10-22T06:33:48.300Z",
  "data": {
    "validation.must_be_a_number": "This field must be a number",
    "validation.must_be_a_string": "This field must be a string",
    "validation.must_be_positive": "This field must be positive",
    "validation.must_be_a_valid_email": "This field must be a valid email",
    "validation.must_be_a_valid_phone_number": "This field must be a valid phone number",
    "validation.must_be_at_least_min_characters": "This field must be at least {min} characters",
    "validation.must_be_at_most_max_characters": "This field must be at most {max} characters",
    "validation.is_required": "This field is required"
  }
}
```

## Configuration Options

```typescript
interface I18nClientModuleOptions {
  apiUrl: string; // Base URL of the translation API
  apiKey: string; // API key for authentication
  defaultLanguage?: string; // Default language code (default: 'en')
  retryConfig?: RetryConfig; // Retry configuration
}

interface RetryConfig {
  maxRetries?: number; // Max retry attempts (default: 3)
  baseDelay?: number; // Base delay in ms (default: 1000)
  maxDelay?: number; // Max delay in ms (default: 10000)
  backoffMultiplier?: number; // Backoff multiplier (default: 2)
}
```

## Scheduled Updates

The module automatically refreshes translations every 3 hours using a cron job (`0 */3 * * *`). You can also trigger manual refreshes:

```typescript
// Manual refresh
await this.i18nClient.manualRefresh();

// Check if refresh is in progress
const isRefreshing = this.i18nClient.isRefreshInProgress();
```

## Error Handling

The module includes comprehensive error handling:

- **Retry Logic**: Automatic retries with exponential backoff
- **Health Checks**: Monitors API availability
- **Logging**: Detailed logging for debugging

## Development

### Building the Package

```bash
npm run build
```

### Publishing

```bash
npm run prepublishOnly
npm publish
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
