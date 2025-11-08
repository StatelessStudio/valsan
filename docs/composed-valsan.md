# Building Reusable Validators with ComposedValSan

Use `ComposedValSan` for building valsans built on reusable components.

## Basic ComposedValSan

```typescript
import { ComposedValSan } from 'valsan';

export class EmailValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimValSan(),
            new LowercaseValSan(),
            new EmailFormatValSan()
        ]);
    }
}

// Clean, reusable API
const emailValidator = new EmailValSan();
const result = await emailValidator.run('  User@Example.COM  ');
console.log(result.data); // "user@example.com"
```

## Advantages of ComposedValSan

### Named Classes

Instead of anonymous pipelines, create named, self-documenting validators:

```typescript
// Instead of anonymous pipelines
const pipeline = new TrimValSan().pipe(new LowercaseValSan());

// Create named, self-documenting validators
class EmailValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimValSan(),
            new LowercaseValSan(),
            new EmailFormatValSan()
        ]);
    }
}
```

### Extendable

Extend composed validators to add custom behavior:

```typescript
class StrictEmailValSan extends EmailValSan {
    override async validate(input: string): Promise<ValidationResult> {
        // Add additional validation on top of base EmailValSan
        const baseResult = await super.validate(input);
        if (!baseResult.isValid) return baseResult;
        
        // Add custom validation
        if (input.includes('+')) {
            return {
                isValid: false,
                errors: [{ 
                    code: 'NO_PLUS_SIGNS', 
                    message: 'Email cannot contain + signs' 
                }]
            };
        }
        
        return { isValid: true, errors: [] };
    }
}
```

### Type Transformations

Chain validators that transform types:

```typescript
class StringToNumberPipeline extends ComposedValSan<string, number> {
    constructor() {
        super([
            new TrimValSan(),
            new StringToNumberValSan(),
            new DoubleNumberValSan()
        ]);
    }
}

const pipeline = new StringToNumberPipeline();
const result = await pipeline.run('  21  ');
console.log(result.data); // 42 (number type)
```

## Complex Example: User Registration

Build specialized validators by composing simple, reusable components:

```typescript
class UsernameValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimValSan(),
            new LowercaseValSan(),
            new MinLengthValSan(3),
            new MaxLengthValSan(20),
            new AlphanumericValSan()
        ]);
    }
}

class AgeValSan extends ComposedValSan<string, number> {
    constructor() {
        super([
            new TrimValSan(),
            new StringToNumberValSan(),
            new RangeValSan(13, 120)
        ]);
    }
}

// Use them in your application
const usernameValidator = new UsernameValSan();
const ageValidator = new AgeValSan();

const usernameResult = await usernameValidator.run('  JohnDoe123  ');
const ageResult = await ageValidator.run('  25  ');
```

## How ComposedValSan Works

### Step Execution

ComposedValSan executes steps in sequence:

1. **Normalize**: Uses the first step's `normalize()` method
2. **Validate**: Uses the first step's `validate()` method
3. **Sanitize**: Chains through all steps' `sanitize()` methods

```typescript
class Pipeline extends ComposedValSan<string, string> {
    constructor() {
        super([
            new StepOne(),   // normalize() + validate() used
            new StepTwo(),   // only sanitize() used
            new StepThree()  // only sanitize() used
        ]);
    }
}
```

### Accessing Steps

Get information about the composed steps:

```typescript
const emailValidator = new EmailValSan();
const steps = emailValidator.getSteps();

console.log(steps.length); // 3
console.log(steps[0]); // TrimValSan instance
```

## Best Practices

1. **Keep steps simple**: Each step should do one thing well
2. **Order matters**: Place normalization steps first, validation next
3. **Reuse components**: Build a library of simple validators to compose
4. **Name your compositions**: Create named classes instead of inline compositions
5. **Test components individually**: Unit test each step before composing
6. **Use options for flexibility**: Pass options to steps for configurability

```typescript
class ConfigurablePasswordValSan extends ComposedValSan<string, string> {
    constructor(minLength: number = 8) {
        super([
            new TrimValSan(),
            new MinLengthValSan(minLength),
            new PasswordComplexityValSan()
        ]);
    }
}

// Different security levels
const basic = new ConfigurablePasswordValSan(6);
const secure = new ConfigurablePasswordValSan(12);
```

## When to Use ComposedValSan

**Use ComposedValSan when:**
- Building validators from reusable components
- Creating multiple similar validators with slight variations
- Need to extend or override specific validation logic
- Want clear, named validator classes

**Use basic ValSan when:**
- Validation logic is unique and won't be reused
- Single-purpose, simple validators
- Custom logic that doesn't fit the composition pattern
- Performance is critical (composition adds slight overhead)

## Combining with Options

Combine ComposedValSan with options for maximum flexibility:

```typescript
interface EmailOptions extends ValSanOptions {
    allowPlusAddressing?: boolean;
    allowedDomains?: string[];
}

class ConfigurableEmailValSan extends ComposedValSan<string, string> {
    constructor(options: EmailOptions = {}) {
        super([
            new TrimValSan(),
            new LowercaseValSan(),
            new EmailFormatValSan(),
            new EmailDomainValSan(options.allowedDomains),
            new PlusAddressingValSan(options.allowPlusAddressing)
        ]);
    }
}

// Corporate email
const corporateEmail = new ConfigurableEmailValSan({
    allowedDomains: ['company.com'],
    allowPlusAddressing: false
});

// Personal email
const personalEmail = new ConfigurableEmailValSan({
    allowPlusAddressing: true
});
```
