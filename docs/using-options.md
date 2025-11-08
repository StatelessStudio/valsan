# Using Options

Pass configuration to ValSan instances via the constructor to make them reusable and flexible.

## Basic Options

```typescript
import { ValSan, ValSanOptions, ValidationResult } from 'valsan';

interface MinLengthOptions extends ValSanOptions {
    minLength?: number;
}

class MinLengthValSan extends ValSan<string, string> {
    private readonly minLength: number;

    constructor(options: MinLengthOptions = {}) {
        super(options);
        this.minLength = options.minLength ?? 3; // Default to 3
    }

    async validate(input: string): Promise<ValidationResult> {
        if (input.length < this.minLength) {
            return {
                isValid: false,
                errors: [{
                    code: 'TOO_SHORT',
                    message: `Input must be at least ${this.minLength} characters`,
                    context: { minLength: this.minLength, actualLength: input.length }
                }]
            };
        }
        return { isValid: true, errors: [] };
    }

    async sanitize(input: string): Promise<string> {
        return input;
    }
}

// Create instances with different configurations
const shortValidator = new MinLengthValSan({ minLength: 3 });
const longValidator = new MinLengthValSan({ minLength: 10 });

await shortValidator.run('hello'); // ✅ passes
await longValidator.run('hello');  // ❌ too short
```

## Options in normalize()

Use options to control normalization behavior:

```typescript
interface NormalizeOptions extends ValSanOptions {
    trim?: boolean;
    lowercase?: boolean;
    uppercase?: boolean;
}

class FlexibleStringValSan extends ValSan<string, string> {
    constructor(private opts: NormalizeOptions = {}) {
        super(opts);
    }

    async normalize(input: string): Promise<string> {
        let result = input;
        
        if (this.opts.trim) {
            result = result.trim();
        }
        if (this.opts.lowercase) {
            result = result.toLowerCase();
        }
        if (this.opts.uppercase) {
            result = result.toUpperCase();
        }
        
        return result;
    }

    async validate(input: string): Promise<ValidationResult> {
        return { isValid: true, errors: [] };
    }

    async sanitize(input: string): Promise<string> {
        return input;
    }
}

// Usage
const trimmer = new FlexibleStringValSan({ trim: true, lowercase: true });
const result = await trimmer.run('  HELLO  '); 
// result.data === 'hello'
```

## Complex Nested Options

For advanced configurations, use nested option objects:

```typescript
interface PasswordOptions extends ValSanOptions {
    requirements?: {
        minLength?: number;
        requireUppercase?: boolean;
        requireLowercase?: boolean;
        requireNumbers?: boolean;
        requireSpecialChars?: boolean;
    };
    sanitization?: {
        trim?: boolean;
    };
}

class PasswordValSan extends ValSan<string, string> {
    constructor(private opts: PasswordOptions = {}) {
        super(opts);
    }

    async normalize(input: string): Promise<string> {
        if (this.opts.sanitization?.trim) {
            return input.trim();
        }
        return input;
    }

    async validate(input: string): Promise<ValidationResult> {
        const errors = [];
        const req = this.opts.requirements ?? {};

        if (req.minLength && input.length < req.minLength) {
            errors.push({
                code: 'TOO_SHORT',
                message: `Password must be at least ${req.minLength} characters`
            });
        }

        if (req.requireUppercase && !/[A-Z]/.test(input)) {
            errors.push({
                code: 'NO_UPPERCASE',
                message: 'Password must contain an uppercase letter'
            });
        }

        if (req.requireLowercase && !/[a-z]/.test(input)) {
            errors.push({
                code: 'NO_LOWERCASE',
                message: 'Password must contain a lowercase letter'
            });
        }

        if (req.requireNumbers && !/[0-9]/.test(input)) {
            errors.push({
                code: 'NO_NUMBER',
                message: 'Password must contain a number'
            });
        }

        if (req.requireSpecialChars && !/[!@#$%^&*]/.test(input)) {
            errors.push({
                code: 'NO_SPECIAL',
                message: 'Password must contain a special character'
            });
        }

        return { isValid: errors.length === 0, errors };
    }

    async sanitize(input: string): Promise<string> {
        return input;
    }
}

// Different security levels
const basicPassword = new PasswordValSan({
    requirements: { minLength: 6 }
});

const securePassword = new PasswordValSan({
    requirements: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    },
    sanitization: { trim: true }
});
```

## Options in sanitize()

Access options during sanitization for transformations:

```typescript
interface FormatOptions extends ValSanOptions {
    prefix?: string;
    suffix?: string;
    dateFormat?: 'ISO' | 'US' | 'EU';
}

class FormattedStringValSan extends ValSan<string, string> {
    constructor(private opts: FormatOptions = {}) {
        super(opts);
    }

    async validate(input: string): Promise<ValidationResult> {
        return { isValid: input.length > 0, errors: [] };
    }

    async sanitize(input: string): Promise<string> {
        let result = input;
        
        if (this.opts.prefix) {
            result = this.opts.prefix + result;
        }
        if (this.opts.suffix) {
            result = result + this.opts.suffix;
        }
        
        return result;
    }
}

const idFormatter = new FormattedStringValSan({ prefix: 'ID-', suffix: '-2024' });
const result = await idFormatter.run('12345');
// result.data === 'ID-12345-2024'
```

## Options with External Dependencies

Pass dependencies through options for testability:

```typescript
interface UserValidatorOptions extends ValSanOptions {
    database?: DatabaseClient;
    minAge?: number;
}

class UserAgeValSan extends ValSan<string, number> {
    constructor(private opts: UserValidatorOptions = {}) {
        super(opts);
    }

    async validate(input: string): Promise<ValidationResult> {
        const age = Number(input);
        const minAge = this.opts.minAge ?? 18;

        if (isNaN(age)) {
            return {
                isValid: false,
                errors: [{ code: 'NOT_A_NUMBER', message: 'Age must be a number' }]
            };
        }

        if (age < minAge) {
            return {
                isValid: false,
                errors: [{
                    code: 'TOO_YOUNG',
                    message: `Must be at least ${minAge} years old`,
                    context: { minAge, actualAge: age }
                }]
            };
        }

        return { isValid: true, errors: [] };
    }

    async sanitize(input: string): Promise<number> {
        return Number(input);
    }
}

// Production
const validator = new UserAgeValSan({ 
    database: prodDatabase,
    minAge: 21 
});

// Testing
const testValidator = new UserAgeValSan({ 
    database: mockDatabase,
    minAge: 18 
});
```

## Best Practices for Options

1. **Extend ValSanOptions**: Always extend the base `ValSanOptions` interface
2. **Use optional properties**: Make options optional with sensible defaults
3. **Document defaults**: Clearly indicate default values in comments
4. **Type your options**: Create dedicated interfaces for type safety
5. **Keep options flat when possible**: Only nest when it improves clarity
6. **Consider reusability**: Design options to work in multiple contexts
7. **Pass dependencies via options**: Makes testing easier

```typescript
interface MyOptions extends ValSanOptions {
    // Validation options
    minValue?: number; // Default: 0
    maxValue?: number; // Default: 100
    
    // Formatting options
    format?: 'standard' | 'compact'; // Default: 'standard'
}
```
