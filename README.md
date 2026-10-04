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
    ObjectValSan,
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

// Create an object validator
const validator = new ObjectValSan({
  schema: {
    username: usernameValSan,
    optionalUsername: usernameValSan.copy({ isOptional: true }),
    email: new EmailValidator(),
  }
});

// Validate & sanitize input data
const result = await validator.run({
    username: 'alice',
    email: 'alice@example.com'
});

if (result.success) {
    console.log('Sanitized:', result.data);
}
else {
    console.error('Validation errors:', result.errors);
    // `path` contains property names and array indices as separate segments.
    // Use `path` to traverse field(s) which failed.
    // `field` may help for debugging but can be ambiguous with dotted keys.
}

// ObjectValSan can also be nested for complex structures:
const addressSchema = new ObjectValSan({
  schema: {
    street: new TrimSanitizer(),
    city: new TrimSanitizer(),
  }
});

const userValidator = new ObjectValSan({
  schema: {
    username: usernameValSan,
    email: new EmailValidator(),
    address: addressSchema, // Nested object
  }
});
```

> **Note**: `ObjectSanitizer` is now deprecated in favor of `ObjectValSan`. `ObjectSanitizer` will be removed in a future major version.

### Using Built-in Primitives

ValSan includes ready-to-use primitive validators for common validation tasks:

```typescript
import { RangeValidator } from 'valsan';

// Number validation
const range = new RangeValidator({ min: 0, max: 100 });
const result = await range.run(150);
console.log(result.success); // false - out of range
```

### Standard Schema interoperability

ValSan instances implement [Standard Schema v1](https://standardschema.dev/), so they can be passed to libraries that accept Standard Schema validators. `ArrayValSan` and `ObjectValSan` can also consume Standard Schema objects.

### JSON Schema export

ValSan and ComposedValSan also expose the
[Standard JSON Schema](https://standardschema.dev/json-schema) interface.
Supported validators can be passed to consumers requiring that interface, such
as Mastra tool schemas, or exported directly:

```typescript
import {
  ArrayValSan, EnumValidator, ObjectValSan, StringToNumberValSan, TrimSanitizer,
} from 'valsan';

const schema = new ObjectValSan({
  schema: {
    name: new TrimSanitizer(),
    count: new StringToNumberValSan(),
    tags: new ArrayValSan({
      schema: new EnumValidator({ allowedValues: ['work', 'home'] }),
    }),
  },
});

const input = schema['~standard'].jsonSchema.input({ target: 'draft-2020-12' });
const output = schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' });
// input.properties.count.type === 'string'
// output.properties.count.type === 'number'
// Both schemas reject undeclared properties.
```

Supported targets are `draft-2020-12` and `draft-07`; other targets throw.
Automatic export covers nested objects/arrays, string/number/boolean enums,
trim/lowercase/uppercase sanitizers, string length/pattern validators, default
email validation, numeric integer/min/max/range validators, and string-to-number
and string-to-boolean transformations. Numeric inputs describe JSON numbers and
strings; bigint is not a JSON value. Runtime validation still checks numeric
string syntax, exact conversion, boolean spellings, and other refinements.
JSON Schema describes the wire shape and representable constraints, not the
sanitization algorithm or every JavaScript validation rule (for example,
JavaScript string length counts UTF-16 units rather than JSON Schema characters).

Single-step compositions export that step. Multi-step, value-preserving
compositions export all step constraints using `allOf`. Multi-step transforming
pipelines require explicit `options.jsonSchema` input/output definitions.
Unsupported built-ins, custom validators, regex flags, restricted email options,
non-JSON enums, cyclic schemas, and arrays allowing undefined elements throw
instead of silently producing an unconstrained schema.

Optional object fields are omitted from `required`, and nullable values use
`anyOf`. Additional properties follow `allowAdditionalProperties`; they are
never silently stripped. External children must implement both validation and
JSON Schema conversion. Without ValSan optionality metadata, external child
properties are treated as required. Reference-bearing child schemas require
explicit definitions on the parent, because nested references need rebasing.

See [custom validators](docs/custom-valsan.md#json-schema-extension-api) for
explicit definitions and subclass conversion hooks.

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
