# Standard Schema and JSON Schema for Custom ValSans

## Standard Schema

Classes extending `ValSan` inherit [Standard Schema v1](https://standardschema.dev/) support. The `~standard` adapter runs normalization, validation, and sanitization; it returns the sanitized value on success and messages with paths on failure.

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

Use options such as `isNullable` and `isUndefinable` to allow those inputs through. Standard Schema input/output types reflect these options and the ValSan input and sanitized output types.

For schemas that do not extend `ValSan`, implement `StandardSchemaV1` with `~standard` metadata (`version: 1` and `vendor`) and a synchronous or asynchronous `validate` returning either `value` or `issues`.

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

For nested errors, include `path` as property keys or array indices. `ObjectValSan` and `ArrayValSan` accept Standard Schema validators directly.

## JSON Schema

JSON Schema export is opt-in via `valsan/json-schema`. Core validators do not expose `~standard.jsonSchema` or load the exporter; their Standard Schema adapters are created lazily and cached on first access.

Use `toJsonSchema(schema, 'input' | 'output', options)` to export directly, or wrap with `withJsonSchema(schema)` for consumers requiring both Standard Schema and Standard JSON Schema (such as Mastra). Supported drafts are `draft-07` and `draft-2020-12`.

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

`withJsonSchema` returns a separate adapter that preserves validation, issue paths, and types without modifying the validator. Call `.run()` and `.copy()` on the original validator. Nested native schemas export automatically. Custom `jsonSchemaDefinition()` hooks and explicit `options.jsonSchema` definitions are supported.

For rule-based export, declare wire types with `type` and, when they differ, `inputType` and `outputType`. These rule kinds derive constraints from their context:

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

For other rules, set `rule.jsonSchema` to a supported constraint, or use `'type-only'` if the rule adds no schema constraint. For unsupported constraints or custom transformations, provide explicit input/output definitions:

```typescript
const validator = new MyValSan({
    jsonSchema: {
        input: { type: 'string', description: 'Value before normalization' },
        output: { type: 'number', description: 'Normalized value' },
    },
});
```

Alternatively, override `jsonSchemaDefinition(direction, options, context)` to return a schema for the non-null value:

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

Import `JsonSchema`, `JsonSchemaDirection`, and `JsonSchemaOptions` from `valsan/json-schema` (also available as type-only exports from `valsan`). The exporter adds nullability, title, and description; explicit `options.jsonSchema` takes precedence over the hook. The default hook derives schemas from wire types and rule metadata, and throws if it cannot do so rather than guessing.

For custom steps in multi-step `ComposedValSan`, override `jsonSchemaPreservesInput` to return `true` only if the step preserves the input's JSON representation. Transforming compositions need explicit input/output definitions.

### Conversion limitations

Exported schemas describe JSON-compatible shapes and supported constraints; they do not replace runtime validation. Numeric-string and boolean-string inputs export as strings without reproducing normalization or runtime checks. JSON Schema length keywords count Unicode code points, while ValSan counts UTF-16 code units; these differ for characters outside the Basic Multilingual Plane.

Native optionality is preserved, including for children wrapped with `withJsonSchema`. Foreign Standard Schema validators have no standard optionality flag, so their object properties are treated as required; define foreign optional/default fields in the parent `options.jsonSchema`. Explicit definitions are also required for unsupported transformations, regex flags, restricted email validators, and reference-bearing child schemas, and must match the selected draft.
