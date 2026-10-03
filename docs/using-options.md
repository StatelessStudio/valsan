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

## Optional Values

### isOptional

Set `isOptional: true` to allow both `null` and `undefined` to pass through
without validation or sanitization:

```typescript
const optional = new MinLengthValidator({
    minLength: 5,
    isOptional: true
});

await optional.run(null);      // passes
await optional.run(undefined); // passes
```

### isNullable

Set `isNullable: true` to allow `null` to pass through without validation or
sanitization. It does not allow `undefined` unless `isUndefinable` or
`isOptional` is also enabled:

```typescript
const nullable = new MinLengthValidator({
    minLength: 5,
    isNullable: true
});

await nullable.run(null);      // passes
await nullable.run(undefined); // fails
```

### isUndefinable

Set `isUndefinable: true` to allow `undefined` to pass through without
validation or sanitization. It does not allow `null` unless `isNullable` or
`isOptional` is also enabled:

```typescript
const undefinable = new MinLengthValidator({
    minLength: 5,
    isUndefinable: true
});

await undefinable.run(undefined); // passes
await undefinable.run(null);      // fails
```

When combined with `isOptional`, an explicit `isNullable` or `isUndefinable`
value overrides `isOptional` for that value.

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
