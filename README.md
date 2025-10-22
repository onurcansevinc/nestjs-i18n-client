# nestjs-i18n-client

A NestJS module built on top of `nestjs-i18n` that adds dynamic translation loading from external APIs. This package extends the powerful `nestjs-i18n` library with automatic translation caching, scheduled updates, and robust error handling with retry mechanisms.

## Features

- 🏗️ **Built on nestjs-i18n**: Extends the popular `nestjs-i18n` library with additional capabilities
- 🔄 **Dynamic Translation Loading**: Fetch translations from external APIs
- ⏰ **Scheduled Updates**: Automatic refresh every 3 hours using `nestjs-schedule`
- 🔐 **Bearer Token Authentication**: Secure API communication
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
      bearerToken: 'your-bearer-token',
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
        bearerToken: configService.get('I18N_BEARER_TOKEN'),
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

### Get All Translations

```
GET /translations
```

**Response:**

```json
{
  "languages": ["en", "tr", "fr"]
}
```

### Get Language Translations

```
GET /translations/:language
```

**Response:**

```json
{
  "language": "en",
  "namespaces": ["common", "auth", "errors"],
  "translations": {
    "welcome": "Welcome",
    "hello": "Hello"
  }
}
```

### Get Namespace Translations

```
GET /translations/:language/:namespace
```

**Response:**

```json
{
  "language": "en",
  "namespace": "common",
  "translations": {
    "welcome": "Welcome",
    "hello": "Hello"
  },
  "lastModified": "2024-01-01T00:00:00Z"
}
```

## Configuration Options

```typescript
interface I18nClientModuleOptions {
  apiUrl: string; // Base URL of the translation API
  bearerToken: string; // Bearer token for authentication
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
