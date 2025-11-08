# Creating Your Own ValSan

A ValSan is a class-based validator and sanitizer that processes input through three phases: normalize → validate → sanitize.

## Quick Start

```typescript
import { ValSan, ValidationResult } from 'valsan';

class EmailValSan extends ValSan<string, string> {
    // 1. Normalize (optional): Clean input before validation
    async normalize(input: string): Promise<string> {
        return input.trim().toLowerCase();
    }

    // 2. Validate (required): Check business rules
    async validate(input: string): Promise<ValidationResult> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(input)) {
            return {
                isValid: false,
                errors: [{
                    code: 'INVALID_EMAIL',
                    message: 'Please provide a valid email address',
                    field: 'email'
                }]
            };
        }

        return { isValid: true, errors: [] };
    }

    // 3. Sanitize (required): Transform to output format
    async sanitize(input: string): Promise<string> {
        return input; // Already normalized
    }
}

// Usage
const validator = new EmailValSan();
const result = await validator.run('  User@Example.COM  ');

if (result.success) {
    console.log('Valid email:', result.data); // "user@example.com"
} else {
    console.error('Errors:', result.errors);
}
```

## Type Transformations

Convert input types during sanitization:

```typescript
class AgeValSan extends ValSan<string, number> {
    async validate(input: string): Promise<ValidationResult> {
        const age = Number(input);
        
        if (isNaN(age)) {
            return {
                isValid: false,
                errors: [{ code: 'NOT_A_NUMBER', message: 'Age must be a number' }]
            };
        }

        if (age < 0 || age > 150) {
            return {
                isValid: false,
                errors: [{ code: 'OUT_OF_RANGE', message: 'Age must be between 0 and 150' }]
            };
        }

        return { isValid: true, errors: [] };
    }

    async sanitize(input: string): Promise<number> {
        return Number(input);
    }
}
```

## Multiple Validation Errors

Return all errors at once:

```typescript
class PasswordValSan extends ValSan<string, string> {
    async validate(input: string): Promise<ValidationResult> {
        const errors: ValidationError[] = [];

        if (input.length < 8) {
            errors.push({
                code: 'TOO_SHORT',
                message: 'Password must be at least 8 characters'
            });
        }

        if (!/[A-Z]/.test(input)) {
            errors.push({
                code: 'NO_UPPERCASE',
                message: 'Password must contain an uppercase letter'
            });
        }

        if (!/[0-9]/.test(input)) {
            errors.push({
                code: 'NO_NUMBER',
                message: 'Password must contain a number'
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async sanitize(input: string): Promise<string> {
        return input;
    }
}
```

## Async Operations

All methods support async operations (database checks, API calls):

```typescript
class UsernameValSan extends ValSan<string, string> {
    constructor(private db: Database) {
        super();
    }

    async normalize(input: string): Promise<string> {
        return input.trim().toLowerCase();
    }

    async validate(input: string): Promise<ValidationResult> {
        // Check if username exists in database
        const exists = await this.db.query(
            'SELECT 1 FROM users WHERE username = ?',
            [input]
        );

        if (exists) {
            return {
                isValid: false,
                errors: [{
                    code: 'USERNAME_TAKEN',
                    message: 'This username is already taken'
                }]
            };
        }

        return { isValid: true, errors: [] };
    }

    async sanitize(input: string): Promise<string> {
        return input;
    }
}
```

## The Three Phases

### 1. `normalize(input)` (Optional)
- **Purpose**: Prepare input for validation
- **Examples**: `trim()`, lowercase, remove formatting
- **Default**: Returns input unchanged
- **When to override**: User-facing inputs that need cleanup

### 2. `validate(input)` (Required)
- **Purpose**: Check business rules and constraints
- **Returns**: `ValidationResult` with errors
- **Examples**: Format checking, range validation, uniqueness
- **Note**: Works on normalized input

### 3. `sanitize(input)` (Required)
- **Purpose**: Transform to final output format
- **Returns**: Transformed data (can change type)
- **Examples**: Parse dates, convert types, hash passwords
- **Note**: Only runs if validation passes

## Best Practices

1. **Keep validation pure**: Don't modify state in `validate()`
2. **Use specific error codes**: Makes error handling easier
3. **Include field names**: Helps with form validation
4. **Normalize user input**: Always trim whitespace, normalize case
5. **Don't repeat normalization**: `sanitize()` receives normalized input
6. **Use context for debugging**: Add extra info to errors

```typescript
errors.push({
    code: 'OUT_OF_RANGE',
    message: 'Value must be between 1 and 100',
    field: 'quantity',
    context: { min: 1, max: 100, actual: input }
});
```

## Next Steps

- [Using Options](using-options.md) - Learn how to pass configuration options to make validators reusable and flexible
- [ComposedValSan](composed-valsan.md) - Build complex validators by composing simple, reusable components

