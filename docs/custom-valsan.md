# Creating Your Own ValSan

A ValSan is a class-based validator and sanitizer that processes input through three phases: normalize → validate → sanitize.

## Quick Start

```typescript
import { ValSan, ValidationResult } from 'valsan';

class MyValSan extends ValSan<string, string> {
    override example = 'look_no_spaces';

    override rules() {
        return {
            word_has_spaces: {
                code: 'word_has_spaces',
                user: {
                    helperText: 'No spaces',
                    errorMessage: 'No spaces allowed',
                },
            },
        };
    }

    async normalize(input: string) {
        return input?.trim().toLowerCase();
    }

    async validate(input: string) {
        if (input.includes(' ')) {
            return this.fail([this.rules().word_has_spaces]);
        }
        return this.pass();
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
3. **Export with the same name** as the class
4. **Document the behavior** clearly in JSDoc comments
5. **Add an example** by overriding the `example` property
