# Standard Schema and JSON Schema for Custom ValSans

## Standard Schema

Custom classes that extend `ValSan` already implement [Standard Schema v1](https://standardschema.dev/). The inherited `~standard` adapter runs the normal ValSan pipeline—normalization, validation, and sanitization—so successful results expose the sanitized value and failures expose their messages and paths. You do not need to implement `~standard` yourself.

```typescript
import type { StandardSchemaV1 } from 'valsan';
import { ValSan, ValidationResult } from 'valsan';

class TrimValSan extends ValSan<string, string> {
    override async validate(): Promise<ValidationResult> {
        return this.pass();
    }

    override async sanitize(input: string): Promise<string> {
        return input.trim();
    }
}

const schema: StandardSchemaV1<string, string | null | undefined> =
    new TrimValSan();

const result = await schema['~standard'].validate('  hello  ');
// { value: 'hello' }
```

Use the ValSan options such as `isNullable` or `isUndefinable` when those inputs should pass through. The Standard Schema input/output types reflect the options and the ValSan's input and sanitized output types.

If your custom schema does not extend `ValSan`, implement `StandardSchemaV1` with a `~standard` property. Its metadata must include `version: 1` and a `vendor`; `validate` may be synchronous or asynchronous and returns either a `value` or an `issues` array.

```typescript
import type { StandardSchemaV1 } from 'valsan';

const schema: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'my-library',
        validate: (input) =>
            typeof input === 'string'
                ? { value: input.trim() }
                : { issues: [{ message: 'Expected a string' }] },
    },
};
```

Include an issue's `path` as an array of property keys or array indices when the error belongs to a nested value. `ObjectValSan` and `ArrayValSan` accept Standard Schema validators directly.

## JSON Schema

JSON Schema conversion is opt-in through `valsan/json-schema`. Core validators
implement Standard Schema validation but do not expose `~standard.jsonSchema`
or load the exporter. Their Standard Schema adapters are created lazily and
cached on first access.

Use `toJsonSchema(schema, 'input' | 'output', options)` for direct conversion,
or `withJsonSchema(schema)` for consumers such as Mastra that require both
Standard Schema and Standard JSON Schema. Conversion supports `draft-07` and
`draft-2020-12`.

```typescript
import { ObjectValSan, LengthValidator } from 'valsan';
import { toJsonSchema, withJsonSchema } from 'valsan/json-schema';

const validator = new ObjectValSan({
    schema: { name: new LengthValidator({ minLength: 1, maxLength: 100 }) },
});

const formSchema = toJsonSchema(validator, 'input', { target: 'draft-07' });
const schema = withJsonSchema(validator);
const inputSchema = schema['~standard'].jsonSchema.input({
    target: 'draft-2020-12',
});
const result = await schema['~standard'].validate({ name: 'Alice' });
```

The adapter is a separate schema object; it preserves validation, issue paths,
and input/output types without modifying the validator. Call `.run()` or
`.copy()` on the original validator, not the adapter. Nested native schemas
are exported automatically; they do not need individual adapters. Existing
custom `jsonSchemaDefinition()` hooks and explicit `options.jsonSchema`
definitions remain supported.

For rule-based conversion, declare the wire types with `type` and, when input and output differ, `inputType` and `outputType`. Recognized rule kinds derive their JSON Schema constraints from their context:

| Kind | Required context | JSON Schema constraints |
| --- | --- | --- |
| `number.minimum` | `{ min: number }` | `minimum` |
| `number.maximum` | `{ max: number }` | `maximum` |
| `number.range` | `{ min: number, max: number }` | `minimum`, `maximum` |
| `string.minLength` | `{ minLength: number }` | `minLength` |
| `string.maxLength` | `{ maxLength: number }` | `maxLength` |
| `string.pattern` | `{ regex: RegExp, pattern: string }` | `pattern` |
| `value.enum` | `{ allowedValues: readonly unknown[] }` | `enum` |
| `string.email` | `{ allowPlusAddress: boolean }` | `format: 'email'`, `maxLength` |
| `string.emailDomains` | `{ allowedDomains: readonly string[] \| undefined }` | Restricted domains need an explicit schema |

```typescript
override type = 'string' as const;

override rules() {
    return {
        pattern: {
            kind: 'string.pattern' as const,
            code: 'custom_pattern',
            context: { regex: /^a/, pattern: '/^a/' },
            user: {
                helperText: 'Starts with a',
                errorMessage: 'Value must start with a',
            },
        },
    };
}
```

Use `rule.jsonSchema` to provide a supported constraint explicitly when a rule cannot be represented by a recognized kind. Use `'type-only'` when a rule affects runtime validation but contributes no JSON Schema constraint. If a constraint is not supported by rule metadata, supply explicit definitions through the `jsonSchema` option:

```typescript
const validator = new MyValSan({
    jsonSchema: {
        input: { type: 'string', description: 'Value before normalization' },
        output: { type: 'number', description: 'Normalized value' },
    },
});
```

Alternatively, override `protected jsonSchemaDefinition(direction, options, context)` to return a schema for the non-null value. The shared exporter applies nullability, title, and description; an explicit `options.jsonSchema` definition takes precedence over the hook. Hooks that do not need the context can omit that parameter.

```typescript
protected override jsonSchemaDefinition(
    direction: JsonSchemaDirection,
    _options: JsonSchemaOptions
): JsonSchema {
    return direction === 'input'
        ? { type: 'string', pattern: '^[0-9]+$' }
        : { type: 'number' };
}
```

Import `JsonSchema`, `JsonSchemaDirection`, and `JsonSchemaOptions` from
`valsan/json-schema` (type-only exports also remain available from `valsan`).
The hook is useful for custom transformations or constraints that cannot be
derived from rules. The default `ValSan` hook derives a schema from `type`/`inputType`/`outputType` and rule metadata through the context; otherwise conversion throws rather than guessing.

For a custom step used in a multi-step `ComposedValSan`, override `jsonSchemaPreservesInput` to return `true` only when the step preserves the input's JSON representation. Transforming compositions need explicit input/output definitions.

### Conversion limitations

Exported schemas describe JSON-compatible shapes and supported constraints;
they are not a substitute for running the validator. For example, numeric
string inputs are exported as strings without reproducing normalization and
range checks, and boolean-string conversion exports the string input shape.
String length keywords count Unicode code points in JSON Schema, whereas
ValSan's runtime length validators count UTF-16 code units. These differ for
characters outside the Basic Multilingual Plane.

Native optionality is preserved, including when a native child is wrapped
with `withJsonSchema`. Foreign Standard Schema validators do not expose a
standard optionality flag, so their object properties are treated as required.
For foreign defaults or optional fields, provide an explicit parent
`options.jsonSchema`. Unsupported transformations, regex flags, restricted
email validators, and reference-bearing child schemas likewise require
explicit definitions. Explicit definitions must match the selected draft.
