# ValSan Naming Conventions

## Overview

ValSan uses semantic naming conventions to clearly communicate the purpose and behavior of each component. The naming follows a consistent pattern that helps developers understand what each class does at a glance.

## Primitive Class Naming

Primitives in ValSan use three different postfixes to indicate their behavior:

### `Sanitizer` - Pure Transformation

Classes ending in `Sanitizer` perform **pure data transformation** with minimal or no validation.

**Characteristics:**
- Primary purpose is to transform/normalize input
- Validation is either absent or extremely permissive
- Always succeeds unless given completely invalid input
- Does not reject valid data based on business rules

**Examples:**
```typescript
import { TrimSanitizer, LowercaseSanitizer, UppercaseSanitizer } from 'valsan';

// Trim whitespace - always succeeds
const trim = new TrimSanitizer();
await trim.run('  hello  '); // → 'hello'

// Convert to lowercase
const lower = new LowercaseSanitizer();
await lower.run('HELLO'); // → 'hello'

// Convert to uppercase
const upper = new UppercaseSanitizer();
await upper.run('hello'); // → 'HELLO'
```

**Current Sanitizers:**
- `TrimSanitizer` - Removes leading/trailing whitespace
- `LowercaseSanitizer` - Converts to lowercase
- `UppercaseSanitizer` - Converts to uppercase

---

### `Validator` - Pure Validation

Classes ending in `Validator` perform **validation without transformation**.

**Characteristics:**
- Primary purpose is to validate input against rules
- Does not transform the data (output === input)
- Can reject input based on business rules
- Used to enforce constraints and requirements

**Examples:**
```typescript
import { 
    MinLengthValidator, 
    MaxLengthValidator, 
    PatternValidator,
    MinValidator,
    RangeValidator 
} from 'valsan';

// String length validation
const minLength = new MinLengthValidator({ minLength: 3 });
await minLength.run('ab'); // → fails, too short

// Pattern validation
const pattern = new PatternValidator({ pattern: /^\d{3}-\d{4}$/ });
await pattern.run('123-4567'); // → succeeds, matches pattern

// Number range validation
const range = new RangeValidator({ min: 0, max: 100 });
await range.run(150); // → fails, out of range
```

**Current String Validators:**
- `MinLengthValidator` - Validates minimum string length
- `MaxLengthValidator` - Validates maximum string length
- `PatternValidator` - Validates against regex pattern

**Current Number Validators:**
- `MinValidator` - Validates minimum numeric value
- `MaxValidator` - Validates maximum numeric value
- `RangeValidator` - Validates numeric range
- `IntegerValidator` - Validates integer (no decimals)

---

### `ValSan` - Validation + Sanitization

Classes ending in `ValSan` perform **both validation and transformation**.

**Characteristics:**
- Validates input format/structure
- Transforms input type or format
- Most commonly used for type conversions
- Combines validation and sanitization in one step

**Examples:**
```typescript
import { 
    StringToNumberValSan, 
    StringToDateValSan, 
    StringToBooleanValSan 
} from 'valsan';

// Convert string to number with validation
const toNumber = new StringToNumberValSan();
await toNumber.run('42'); // → 42 (number type)
await toNumber.run('abc'); // → fails, not a number

// Convert string to Date with validation
const toDate = new StringToDateValSan();
await toDate.run('2024-01-15'); // → Date object
await toDate.run('invalid'); // → fails, not a date

// Convert string to boolean with validation
const toBool = new StringToBooleanValSan();
await toBool.run('yes'); // → true
await toBool.run('maybe'); // → fails, not a boolean string
```

**Current Transform ValSans:**
- `StringToNumberValSan` - Validates and converts string to number
- `StringToDateValSan` - Validates and converts string to Date
- `StringToBooleanValSan` - Validates and converts string to boolean

---

## Composed Validators

When creating composed validators (using `ComposedValSan`), the naming convention depends on the purpose:

### Use `ValSan` for Composed Validators

Most composed validators should use the `ValSan` postfix since they typically combine validation and sanitization:

```typescript
import { ComposedValSan, TrimSanitizer, LowercaseSanitizer, MinLengthValidator } from 'valsan';

// Composed validator with ValSan postfix
export class UsernameValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimSanitizer(),
            new LowercaseSanitizer(),
            new MinLengthValidator({ minLength: 3 })
        ]);
    }
}
```

### Use `Validator` for Pure Validation Pipelines

If a composed validator only validates without transforming:

```typescript
export class StrictEmailValidator extends ComposedValSan<string, string> {
    constructor() {
        super([
            new MinLengthValidator({ minLength: 5 }),
            new PatternValidator({ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
        ]);
    }
}
```

### Use `Sanitizer` for Pure Sanitization Pipelines

If a composed validator only sanitizes without strict validation:

```typescript
export class TextSanitizer extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimSanitizer(),
            new LowercaseSanitizer()
        ]);
    }
}
```

## Examples in Practice

### Building a User Registration Form

```typescript
import {
    ComposedValSan,
    TrimSanitizer,
    LowercaseSanitizer,
    MinLengthValidator,
    PatternValidator,
    StringToNumberValSan,
    RangeValidator,
    IntegerValidator
} from 'valsan';

// Email: sanitize then validate
class EmailValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimSanitizer(),           // Sanitizer: transform
            new LowercaseSanitizer(),      // Sanitizer: transform
            new PatternValidator({         // Validator: validate only
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            })
        ]);
    }
}

// Age: convert type then validate
class AgeValSan extends ComposedValSan<string, number> {
    constructor() {
        super([
            new TrimSanitizer(),           // Sanitizer: transform
            new StringToNumberValSan(),    // ValSan: transform + validate
            new IntegerValidator(),        // Validator: validate only
            new RangeValidator({ min: 13, max: 120 }) // Validator
        ]);
    }
}

// Username: sanitize then validate
class UsernameValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimSanitizer(),           // Sanitizer
            new LowercaseSanitizer(),      // Sanitizer
            new MinLengthValidator({ minLength: 3 }), // Validator
            new MaxLengthValidator({ maxLength: 20 }), // Validator
            new PatternValidator({         // Validator
                pattern: /^[a-z0-9_]+$/
            })
        ]);
    }
}
```

Notice how:
- `Sanitizer` classes appear first (data normalization)
- `Validator` classes appear last (business rules)
- `ValSan` classes handle type transformations
- The composed class name reflects the overall purpose

## Guidelines for New Primitives

When creating new primitives, follow these guidelines:

1. **Choose the right postfix** based on the primary behavior
2. **Be specific** in the prefix (e.g., `MinLength` not just `Length`)
3. **Use PascalCase** for class names
4. **Use kebab-case** for file names (e.g., `min-length-validator.ts`)
5. **Export with the same name** as the class
6. **Document the behavior** clearly in JSDoc comments
