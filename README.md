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

### Using Built-in Primitives

ValSan includes ready-to-use primitive validators for common validation tasks:

```typescript
import { 
    TrimSanitizer, 
    LowercaseSanitizer, 
    MinLengthValidator,
    StringToNumberValSan,
    RangeValidator 
} from 'valsan';

// String validation
const trim = new TrimSanitizer();
const result1 = await trim.run('  hello  ');
console.log(result1.data); // "hello"

// String length validation
const minLength = new MinLengthValidator({ minLength: 3 });
const result2 = await minLength.run('hi');
console.log(result2.success); // false - too short

// Type transformation
const toNumber = new StringToNumberValSan();
const result3 = await toNumber.run('42');
console.log(result3.data); // 42 (number type)

// Number validation
const range = new RangeValidator({ min: 0, max: 100 });
const result4 = await range.run(150);
console.log(result4.success); // false - out of range
```

**Available Primitives:**
- **String**: `TrimSanitizer`, `LowercaseSanitizer`, `UppercaseSanitizer`, `MinLengthValidator`, `MaxLengthValidator`, `PatternValidator`
- **Number**: `MinValidator`, `MaxValidator`, `RangeValidator`, `IntegerValidator`
- **Transform**: `StringToNumberValSan`, `StringToDateValSan`, `StringToBooleanValSan`

See the [Primitives Reference](docs/primitives-reference.md) for complete documentation.

### Creating Custom Validators

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

Compose primitives together to create complex validators:

```typescript
import { 
    ComposedValSan, 
    TrimSanitizer, 
    LowercaseSanitizer, 
    MinLengthValidator,
    MaxLengthValidator,
    PatternValidator 
} from 'valsan';

// Create a username validator by composing primitives
export class UsernameValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimSanitizer(),
            new LowercaseSanitizer(),
            new MinLengthValidator({ minLength: 3 }),
            new MaxLengthValidator({ maxLength: 20 }),
            new PatternValidator({ 
                pattern: /^[a-z0-9_]+$/,
                errorMessage: 'Only lowercase letters, numbers, and underscores'
            })
        ]);
    }
}

// Use it anywhere
const validator = new UsernameValSan();
const result = await validator.run('  JohnDoe123  ');
console.log(result.data); // "johndoe123"

// Or compose with type transformation
import { StringToNumberValSan, IntegerValidator, RangeValidator } from 'valsan';

export class AgeValSan extends ComposedValSan<string, number> {
    constructor() {
        super([
            new TrimSanitizer(),
            new StringToNumberValSan(),
            new IntegerValidator(),
            new RangeValidator({ min: 0, max: 120 })
        ]);
    }
}

const ageValidator = new AgeValSan();
const ageResult = await ageValidator.run('  25  ');
console.log(ageResult.data); // 25 (number type)
```

You can also create custom building blocks and compose them:

```typescript
import { ComposedValSan, ValSan, ValidationResult } from 'valsan';

// Define reusable building blocks
class TrimSanitizer extends ValSan<string, string> {
    async validate(): Promise<ValidationResult> {
        return { isValid: true, errors: [] };
    }
    async sanitize(input: string): Promise<string> {
        return input.trim();
    }
}

class LowercaseSanitizer extends ValSan<string, string> {
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
            new TrimSanitizer(),
            new LowercaseSanitizer(),
            new EmailFormatValSan()
        ]);
    }
}

// Use it anywhere
const emailValidator = new EmailValSan();
const result = await emailValidator.run('  User@Example.COM  ');
console.log(result.data); // "user@example.com"
```

## Documentation

- [Primitives Reference](docs/primitives-reference.md) - Complete guide to all built-in primitive validators
- [Creating Your Own ValSan](docs/custom-valsan.md) - Guide for implementing custom validators and sanitizers
- [Using Options](docs/using-options.md) - Learn how to pass configuration options to make validators reusable
- [ComposedValSan](docs/composed-valsan.md) - Build complex validators by composing simple, reusable components

## Contributing & Development

See [contributing.md](docs/contributing/contributing.md) for information on how to develop or contribute to this project!
