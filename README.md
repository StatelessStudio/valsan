# ValSan

ValSan provides a clean, type-safe way to validate and transform data and input.

## Features

- **Type-safe** - Full TypeScript support with generics
- **Async-first** - Built for I/O operations (supports DB checks, API calls)
- **Structured errors** - Machine-readable error codes with context
- **Type transformation** - Convert types during sanitization
- **Configurable** - Pass options to customize validator behavior
- **Extensible** - Create your own ValSans
- **Composable** - Build validation/sanitization pipelines

## Install

```bash
npm install valsan
```
## Quick Start

### What is a ValSan?

A ValSan is a Validator + Sanitizer. It checks input data, and returns it in a clean and consistent type/format.

### Example - Object Validation & Sanitization

```typescript
import {
    ObjectSanitizer,
    LengthValidator,
    LowercaseSanitizer,
    TrimSanitizer,
    EmailValidator,
    ComposedValSan
} from 'valsan';

const usernameValSan = new ComposedValSan<string, string>([
    new TrimSanitizer(),
    new LengthValidator({ minLength: 5, maxLength: 10 }),
    new LowercaseSanitizer(),
]);

// Create an object sanitizer
const sanitizer = new ObjectSanitizer({
  username: usernameValSan,
  optionalUsername: usernameValSan.copy({ isOptional: true }),
  email: new EmailValidator(),
});

// Validate & sanitize input data
const result = await sanitizer.run({
    username: 'alice',
    email: 'alice@example.com'
});

if (result.success) {
    console.log('Sanitized:', result.data);
}
else {
    console.error('Validation errors:', result.errors);
}
```

### Using Built-in Primitives

ValSan includes ready-to-use primitive validators for common validation tasks:

```typescript
import { RangeValidator } from 'valsan';

// Number validation
const range = new RangeValidator({ min: 0, max: 100 });
const result = await range.run(150);
console.log(result.success); // false - out of range
```

### Primitives Library

Compose your own validators from built-in primitives:

[Primitives Reference](docs/primitives-reference.md)

## More

- [Custom Validators](docs/custom-valsan.md)
- [Composed Validators](docs/composed-valsan.md)
- [Options](docs/using-options.md)
- [Rules](docs/rules.md)

## Contributing & Development

See [contributing.md](docs/contributing/contributing.md) for information on how to develop or contribute to this project!
