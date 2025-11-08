# ValSan

**Class-based validation and sanitization for TypeScript**

ValSan provides a clean, type-safe way to validate and transform data and input.

## Features

- ✅ **Type-safe** - Full TypeScript support with generics
- ✅ **Async-first** - Built for I/O operations (DB checks, API calls)
- ✅ **Structured errors** - Machine-readable error codes with context
- ✅ **Normalization** - Clean input before validation (trim, lowercase, etc.)
- ✅ **Type transformation** - Convert types during sanitization
- ✅ **Configurable** - Pass options to customize validator behavior

## Installation

```bash
npm install valsan
```

## Quick Start

```typescript
import { ValSan, ValidationResult } from 'valsan';

class EmailValSan extends ValSan<string, string> {
    async normalize(input: string): Promise<string> {
        return input.trim().toLowerCase();
    }

    async validate(input: string): Promise<ValidationResult> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(input)) {
            return {
                isValid: false,
                errors: [{
                    code: 'INVALID_EMAIL',
                    message: 'Please provide a valid email address'
                }]
            };
        }

        return { isValid: true, errors: [] };
    }

    async sanitize(input: string): Promise<string> {
        return input;
    }
}

// Usage
const validator = new EmailValSan();
const result = await validator.run('  User@Example.COM  ');

if (result.success) {
    console.log(result.data); // "user@example.com"
} else {
    console.error(result.errors);
}
```

## Creating ValSans

- [Creating Your Own ValSan](docs/custom-valsan.md) - Guide for implementing custom validators and sanitizers
- [Using Options](docs/using-options.md) - Learn how to pass configuration options to make validators reusable

## Contributing & Development

See [contributing.md](docs/contributing/contributing.md) for information on how to develop or contribute to this project!
