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

## Building Reusable Validators with ComposedValSan

`ComposedValSan` to create named classes:

```typescript
import { ComposedValSan, ValSan, ValidationResult } from 'valsan';

// Define reusable building blocks
class TrimValSan extends ValSan<string, string> {
    async validate(): Promise<ValidationResult> {
        return { isValid: true, errors: [] };
    }
    async sanitize(input: string): Promise<string> {
        return input.trim();
    }
}

class LowercaseValSan extends ValSan<string, string> {
    async validate(input: string): Promise<ValidationResult> {
        if (input.length === 0) {
            return {
                isValid: false,
                errors: [{ code: 'EMPTY', message: 'Cannot be empty' }]
            };
        }
        return { isValid: true, errors: [] };
    }
    async sanitize(input: string): Promise<string> {
        return input.toLowerCase();
    }
}

class EmailFormatValSan extends ValSan<string, string> {
    async validate(input: string): Promise<ValidationResult> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
            return {
                isValid: false,
                errors: [{ 
                    code: 'INVALID_EMAIL', 
                    message: 'Invalid email format' 
                }]
            };
        }
        return { isValid: true, errors: [] };
    }
    async sanitize(input: string): Promise<string> {
        return input;
    }
}

// Compose them into a reusable validator
export class EmailValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimValSan(),
            new LowercaseValSan(),
            new EmailFormatValSan()
        ]);
    }
}

// Use it anywhere
const emailValidator = new EmailValSan();
const result = await emailValidator.run('  User@Example.COM  ');
console.log(result.data); // "user@example.com"
```

## Creating ValSans

- [Creating Your Own ValSan](docs/custom-valsan.md) - Guide for implementing custom validators and sanitizers
- [Using Options](docs/using-options.md) - Learn how to pass configuration options to make validators reusable
- [ComposedValSan](docs/composed-valsan.md) - Build complex validators by composing simple, reusable components

## Contributing & Development

See [contributing.md](docs/contributing/contributing.md) for information on how to develop or contribute to this project!
