
# Composed ValSans

Compose validators by chaining steps:

```typescript
import {
        ComposedValSan,
        TrimSanitizer,
        LowercaseSanitizer,
        LengthValidator,
        AlphaNumericValidator,
} from 'valsan';

class UsernameValSan extends ComposedValSan<string, string> {
    constructor() {
        super([
            new TrimSanitizer(),
            new LowercaseSanitizer(),
            new LengthValidator({ minLength: 3, maxLength: 60 }),
            new AlphaNumericValidator()
        ]);
    }
}
```


## Best Practices

1. **Keep steps simple**: Each step should do one thing well
2. **Order matters**: Place normalization steps first, validation next
3. **Reuse components**: Build a library of simple validators to compose
4. **Name your compositions**: Create named classes instead of inline compositions
5. **Test components individually**: Unit test each step before composing
6. **Use options for flexibility**: Pass options to steps for configurability


## Basic Options

### Passing Options to Child Steps

You can pass options from the composed validator down to individual child steps. This is perfect for creating configurable validators where parent options control child behavior:

```typescript
interface EmailAddressOptions extends ComposedValSanOptions {
    maxLength?: number;
    minLength?: number;
}

class EmailAddressValSan extends ComposedValSan<string, string> {
    constructor(options: EmailAddressOptions = {}) {
        super([
            new TrimSanitizer(),
            new LengthValidator({
                minLength: options.minLength ?? 3,
                maxLength: options.maxLength ?? 255
            }),
            new LowercaseSanitizer(),
            new EmailValidator(),
        ], options);
    }
}

// Usage examples
const standard = new EmailAddressValSan({ maxLength: 254 });
const strict = new EmailAddressValSan({ minLength: 8, maxLength: 50 });

await standard.run('user@example.com'); // ✅ passes
await strict.run('a@b.c');              // ❌ fails minLength
```
