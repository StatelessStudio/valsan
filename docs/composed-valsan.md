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

ComposedValSan supports constructor options just like ValSan, allowing you to pass configuration to customize behavior:

### Basic Options

```typescript
import { ComposedValSan, ComposedValSanOptions } from 'valsan';

interface EmailOptions extends ComposedValSanOptions {
    allowUppercase?: boolean;
    customDomain?: string;
}

class ConfigurableEmailValSan extends ComposedValSan<string, string> {
    constructor(options: EmailOptions = {}) {
        // Conditionally include steps based on options
        const steps = [new TrimValSan()];
        
        if (!options.allowUppercase) {
            steps.push(new LowercaseValSan());
        }
        
        steps.push(new EmailFormatValSan());
        
        // Pass options to super constructor
        super(steps, options);
    }
    
    // Override run() to use options for custom validation
    override async run(input: string): Promise<SanitizeResult<string>> {
        const result = await super.run(input);
        const opts = this.options as EmailOptions;
        
        // Apply custom domain validation if specified
        if (result.success && result.data && opts.customDomain) {
            if (!result.data.endsWith(`@${opts.customDomain}`)) {
                return {
                    success: false,
                    errors: [{
                        code: 'INVALID_DOMAIN',
                        message: `Email must be from domain ${opts.customDomain}`,
                        context: { expectedDomain: opts.customDomain }
                    }]
                };
            }
        }
        
        return result;
    }
}

// Usage examples
const defaultEmail = new ConfigurableEmailValSan();
await defaultEmail.run('USER@EXAMPLE.COM'); // "user@example.com"

const uppercaseEmail = new ConfigurableEmailValSan({ allowUppercase: true });
await uppercaseEmail.run('USER@EXAMPLE.COM'); // "USER@EXAMPLE.COM"

const domainEmail = new ConfigurableEmailValSan({ customDomain: 'company.com' });
await domainEmail.run('user@company.com');  // ✅ passes
await domainEmail.run('user@other.com');    // ❌ fails with INVALID_DOMAIN
```

### Using Options to Configure Steps

Options can control which steps are included in the composition:

```typescript
interface NumberPipelineOptions extends ComposedValSanOptions {
    multiplier?: number;
    allowNegative?: boolean;
}

class ConfigurableNumberPipeline extends ComposedValSan<string, number> {
    constructor(options: NumberPipelineOptions = {}) {
        const steps = [
            new TrimValSan(),
            new StringToNumberValSan()
        ];
        
        // Conditionally add validation based on options
        if (!options.allowNegative) {
            steps.push(new PositiveNumberValSan());
        }
        
        super(steps, options);
    }
    
    override async run(input: string): Promise<SanitizeResult<number>> {
        const result = await super.run(input);
        const opts = this.options as NumberPipelineOptions;
        
        // Apply optional transformation based on options
        if (result.success && result.data !== undefined && opts.multiplier) {
            return {
                success: true,
                data: result.data * opts.multiplier,
                errors: []
            };
        }
        
        return result;
    }
}

// Different configurations
const basic = new ConfigurableNumberPipeline();
const scaled = new ConfigurableNumberPipeline({ multiplier: 10 });
const permissive = new ConfigurableNumberPipeline({ allowNegative: true });

await basic.run('42');      // 42
await scaled.run('42');     // 420
await permissive.run('-5'); // -5 (allowed)
```

### Options Best Practices for ComposedValSan

1. **Extend ComposedValSanOptions**: Always extend the base interface
   ```typescript
   interface MyOptions extends ComposedValSanOptions {
       myOption?: string;
   }
   ```

2. **Pass options to super()**: Always pass options as the second parameter
   ```typescript
   super(steps, options);
   ```

3. **Use options to configure steps**: Build step arrays conditionally
   ```typescript
   const steps = [];
   if (options.featureEnabled) {
       steps.push(new FeatureValSan());
   }
   ```

4. **Delegate options to child validators**: Pass parent options to children
   ```typescript
   if (options.maxLength) {
       steps.push(new MaxLengthValidator({ maxLength: options.maxLength }));
   }
   ```

5. **Access options in run()**: Override run() to use options for post-processing
   ```typescript
   override async run(input: T): Promise<SanitizeResult<U>> {
       const result = await super.run(input);
       const opts = this.options as MyOptions;
       // Use opts for custom logic
   }
   ```

6. **Provide sensible defaults**: Make all options optional with good defaults
   ```typescript
   constructor(options: MyOptions = {}) {
       const minLength = options.minLength ?? 3;
       // ...
   }
   ```

7. **Document your options**: Clearly document what each option does
   ```typescript
   interface MyOptions extends ComposedValSanOptions {
       /** Maximum length allowed for input (default: 100) */
       maxLength?: number;
       /** Whether to allow special characters (default: true) */
       allowSpecialChars?: boolean;
   }
   ```

### Passing Options to Child Steps

You can pass options from the composed validator down to individual child steps. This is perfect for creating configurable validators where parent options control child behavior:

```typescript
interface EmailAddressOptions extends ComposedValSanOptions {
    maxLength?: number;
    minLength?: number;
    allowPlusAddressing?: boolean;
}

class EmailAddressValSan extends ComposedValSan<string, string> {
    constructor(options: EmailAddressOptions = {}) {
        const steps = [
            new TrimValSan()
        ];
        
        // Pass options down to child validators
        if (options.minLength) {
            steps.push(new MinLengthValSan({ minLength: options.minLength }));
        }
        
        if (options.maxLength) {
            steps.push(new MaxLengthValSan({ maxLength: options.maxLength }));
        }
        
        steps.push(
            new LowercaseValSan(),
            new EmailFormatValSan()
        );
        
        if (!options.allowPlusAddressing) {
            steps.push(new NoPlusSignValSan());
        }
        
        super(steps, options);
    }
}

// Usage examples
const standard = new EmailAddressValSan({ maxLength: 254 });
const strict = new EmailAddressValSan({ 
    minLength: 5,
    maxLength: 50,
    allowPlusAddressing: false 
});

await standard.run('user@example.com'); // ✅ passes
await strict.run('a@b.c');              // ❌ fails minLength
await strict.run('user+tag@example.com'); // ❌ fails allowPlusAddressing
```

### Combining Parent and Child Options

For more complex scenarios, you can combine options for the composition itself with options for child steps:

```typescript
interface PasswordOptions extends ComposedValSanOptions {
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    customMessage?: string; // For parent composition
}

class PasswordValSan extends ComposedValSan<string, string> {
    constructor(options: PasswordOptions = {}) {
        const steps = [new TrimValSan()];
        
        // Pass options to child validators
        if (options.minLength) {
            steps.push(new MinLengthValSan({ minLength: options.minLength }));
        }
        
        if (options.maxLength) {
            steps.push(new MaxLengthValSan({ maxLength: options.maxLength }));
        }
        
        // Conditionally add validators based on requirements
        if (options.requireUppercase) {
            steps.push(new UppercaseRequiredValSan());
        }
        
        if (options.requireNumbers) {
            steps.push(new NumberRequiredValSan());
        }
        
        if (options.requireSpecialChars) {
            steps.push(new SpecialCharRequiredValSan());
        }
        
        super(steps, options);
    }
    
    override async run(input: string): Promise<SanitizeResult<string>> {
        const result = await super.run(input);
        const opts = this.options as PasswordOptions;
        
        // Use parent option for custom behavior
        if (!result.success && opts.customMessage) {
            return {
                success: false,
                errors: [{
                    code: 'PASSWORD_INVALID',
                    message: opts.customMessage,
                    context: { originalErrors: result.errors }
                }]
            };
        }
        
        return result;
    }
}

// Different security profiles
const basicPassword = new PasswordValSan({ 
    minLength: 6 
});

const corporatePassword = new PasswordValSan({
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    customMessage: 'Password does not meet corporate security requirements'
});
```

### Pattern: Options Delegation

A common pattern is to extract parent options and delegate them to children:

```typescript
interface AddressOptions extends ComposedValSanOptions {
    // Options for child validators
    minZipLength?: number;
    maxZipLength?: number;
    allowedCountries?: string[];
    
    // Options for composition behavior
    strict?: boolean;
}

class AddressValSan extends ComposedValSan<Address, Address> {
    constructor(options: AddressOptions = {}) {
        const steps = [
            new TrimFieldsValSan(),
            new ZipCodeValSan({
                minLength: options.minZipLength ?? 5,
                maxLength: options.maxZipLength ?? 10
            }),
            new CountryValSan({
                allowedCountries: options.allowedCountries
            })
        ];
        
        if (options.strict) {
            steps.push(new StreetAddressFormatValSan());
        }
        
        super(steps, options);
    }
}

// Configure both parent and children
const usAddress = new AddressValSan({
    minZipLength: 5,
    maxZipLength: 10,
    allowedCountries: ['US', 'USA'],
    strict: true
});
```

### Best Practice: Separate Option Interfaces

For clarity, you can separate parent and child options:

```typescript
// Child validator options
interface MinLengthOptions extends ValSanOptions {
    minLength: number;
}

interface MaxLengthOptions extends ValSanOptions {
    maxLength: number;
}

// Parent composition options
interface UserInputOptions extends ComposedValSanOptions {
    minLength?: number;
    maxLength?: number;
    allowWhitespace?: boolean;
}

class UserInputValSan extends ComposedValSan<string, string> {
    constructor(options: UserInputOptions = {}) {
        const steps = [];
        
        if (!options.allowWhitespace) {
            steps.push(new TrimValSan());
        }
        
        // Delegate to child options
        if (options.minLength !== undefined) {
            steps.push(new MinLengthValSan({ minLength: options.minLength }));
        }
        
        if (options.maxLength !== undefined) {
            steps.push(new MaxLengthValSan({ maxLength: options.maxLength }));
        }
        
        super(steps, options);
    }
}
```
