# Creating Your Own ValSan

A ValSan is a class-based validator and sanitizer that processes input through three phases: normalize → validate → sanitize.

## Quick Start

```typescript
import { ValSan, ValidationResult } from 'valsan';

class MyValSan extends ValSan<string, string> {
    async normalize(input: string) {
        return input?.trim().toLowerCase();
    }

    async validate(input: string) {
        if (input.includes(' ')) {
            return validationError([
                { code: 'WORD_HAS_SPACES', message: 'No spaces allowed' }
            ]);
        }

        return validationSuccess();
    }

    async sanitize(input: string) {
        return input;
    }
}
```

## Naming Conventions

- Use `Sanitizer` for pure transformations (e.g. `TrimSanitizer`)
- Use `Validator` for pure validation (e.g. `MinLengthValidator`)
- Use `ValSan` for classes that both validate and transform (e.g. `StringToNumberValSan`)

## Guidelines for New Primitives

When creating new primitives, follow these guidelines:

1. **Choose the right postfix** based on the primary behavior
2. **Be specific** in the prefix (e.g., `MinLength` not just `Length`)
5. **Export with the same name** as the class
6. **Document the behavior** clearly in JSDoc comments
