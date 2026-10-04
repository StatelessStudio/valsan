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

`ValSan` exposes synchronous Standard JSON Schema conversion through `~standard.jsonSchema.input(options)` and `.output(options)`. It also provides `toJsonSchema('input' | 'output', options)` for direct conversion. Conversion supports `draft-07` and `draft-2020-12`.

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

Alternatively, override `protected jsonSchemaDefinition(direction, options)` to return a schema for the non-null value. The shared exporter applies nullability, title, and description; an explicit `options.jsonSchema` definition takes precedence over the hook.

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

Import `JsonSchema`, `JsonSchemaDirection`, and `JsonSchemaOptions` from `valsan`. The hook is useful for custom transformations or constraints that cannot be derived from rules. The default implementation derives a schema from `type`/`inputType`/`outputType` and rule metadata when possible; otherwise conversion throws rather than guessing.

For a custom step used in a multi-step `ComposedValSan`, override `jsonSchemaPreservesInput` to return `true` only when the step preserves the input's JSON representation. Transforming compositions need explicit input/output definitions.
