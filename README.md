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
- ✨ **Type-Safe Autocomplete**: Automatic IntelliSense for translation keys
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

- `@nestjs/common`: ^10.0.0 || ^11.0.0
- `@nestjs/core`: ^10.0.0 || ^11.0.0
- `@nestjs/schedule`: ^4.0.0 || ^5.0.0
- `nestjs-i18n`: >=10.6.0 <11.0.0
- `rxjs`: ^7.0.0
- `reflect-metadata`: ^0.1.13 || ^0.2.0
- `class-validator`: ^0.13.0 || ^0.14.0
- `class-transformer`: ^0.4.0 || ^0.5.0

**Important**:

- Make sure to install `reflect-metadata` as it's required for NestJS decorators to work properly
- The package uses CommonJS format for maximum compatibility with NestJS projects
- All runtime dependencies are properly declared as peerDependencies to avoid version conflicts
- Peer dependency ranges are capped to tested major/minor lines instead of open-ended `>=` ranges
- The repo keeps an exact dev dependency for `nestjs-i18n` and a compatibility test for supported 10.x lines

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
      category: 'web', // Optional, defaults to 'web'
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
        category: configService.get('I18N_CATEGORY', 'web'), // Optional, defaults to 'web'
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
  constructor(private readonly i18n: I18nService) {}

  async getMessage() {
    // ✨ Type-safe autocomplete works automatically!
    // Start typing: this.i18n.t('success.
    const message = this.i18n.t('success.health_status_retrieved_successfully');
    return message;
  }
}
```

**Note**: TypeScript autocomplete is automatically generated on module initialization. No additional setup required!

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
GET /translations/language?category=web
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

**Note:** The module loads translations per language using the endpoint below. To get all translations at once, you can use:

```
GET /translations?category=web
```

**Query Parameters:**

- `category` (required): Category of translations (e.g., 'web', 'mobile')

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
GET /translations?category=web&language=en
```

**Query Parameters:**

- `category` (required): Category of translations (e.g., 'web', 'mobile')
- `language` (required): Language code (e.g., 'en', 'tr', 'de')

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

## TypeScript Autocomplete

The module automatically generates TypeScript types for your translation keys, providing full IntelliSense autocomplete support in your IDE.

### How It Works

1. **Automatic Generation**: When `I18nClientModule` initializes, it fetches translations from your API and generates TypeScript type definitions
2. **Zero Configuration**: Types are generated automatically - no manual setup required
3. **Watch Mode Optimized**: Type generation is optimized for `nest start --watch` to prevent restart loops
4. **Module Augmentation**: Automatically extends `nestjs-i18n`'s `I18nService.t()` method with type-safe autocomplete

### Usage

Simply use `I18nService` as you normally would - autocomplete works automatically:

```typescript
import { I18nService } from 'nestjs-i18n';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyService {
  constructor(private readonly i18n: I18nService) {}

  getMessage() {
    // ✨ IntelliSense will show autocomplete when you type:
    // this.i18n.t('success.
    const message = this.i18n.t('success.health_status_retrieved_successfully');
    // ✅ Fully type-safe with autocomplete!
    return message;
  }
}
```

### Manual Type Generation

If you need to manually generate types (e.g., in CI/CD), you can use the CLI script:

```bash
npm run generate:types -- --api-url https://your-api.com --api-key your-key --category web --language en
```

Or use the programmatic API:

```typescript
import { generateTypesFromAPI } from 'nestjs-i18n-client';

await generateTypesFromAPI({
  apiUrl: 'https://your-api.com',
  apiKey: 'your-key',
  category: 'web',
  defaultLanguage: 'en',
});
```

### Troubleshooting

**Autocomplete not working?**

1. Make sure your NestJS app has started at least once (types are generated on module initialization)
2. Restart your TypeScript server in your IDE (VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server")
3. Check that `node_modules/nestjs-i18n-client/types.d.ts` exists and contains your translation keys

**Types not generated?**

- Check your API URL and API key are correct
- Verify the API endpoint `/translations?category=web&language=en` returns data
- Check application logs for type generation errors (they're logged as warnings)

## Configuration Options

```typescript
interface I18nClientModuleOptions {
  apiUrl: string; // Base URL of the translation API
  apiKey: string; // API key for authentication
  defaultLanguage?: string; // Default language code (default: 'en')
  category?: string; // Category for translations (default: 'web')
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
