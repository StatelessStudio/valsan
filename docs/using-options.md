# Using Options (Quick)

Pass options to any validator or sanitizer via the constructor:

```typescript
import { MinLengthValidator } from 'valsan';
const minLen = new MinLengthValidator({ minLength: 5 });
await minLen.run('hi'); // fails
```

You can use options to:
- Set validation rules (e.g. min/max)
- Control normalization (e.g. trim, lowercase)
- Pass dependencies (e.g. database)

All options are optional and have sensible defaults. See validator docs for details.

## Copying

You can copy an existing validator or sanitizer and override its options or rules using the `.copy()` method. This is handy when you want a slightly different behavior (for example making a validator optional) without recreating the instance.

Example:

```typescript
import { ComposedValSan, MinLengthValidator } from 'valsan';

const minLen = new ComposedValSan([
    MinLengthValidator({ minLength: 5 })
]);

// Copy to make optional
const optionalMinLen = minLen.copy({ isOptional: true });

await minLen.run('hi');              // fails
await optionalMinLen.run(undefined); // passes because it's now optional
```

`.copy()` returns a new instance with the provided overrides merged into the original options; the original instance is unchanged.
