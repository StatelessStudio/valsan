# Creating Your Own ValSan

A ValSan is a class-based validator and sanitizer that processes input through three phases: normalize → validate → sanitize.

## Quick Start

```typescript
import { ValSan, ValidationResult } from 'valsan';

class MyValSan extends ValSan<string, string> {
    override example = 'look_no_spaces';

    override rules() {
        return {
            word_has_spaces: {
                code: 'word_has_spaces',
                user: {
                    helperText: 'No spaces',
                    errorMessage: 'No spaces allowed',
                },
            },
        };
    }

    async normalize(input: string) {
        return input?.trim().toLowerCase();
    }

    async validate(input: string) {
        if (input.includes(' ')) {
            return this.fail([this.rules().word_has_spaces]);
        }
        return this.pass();
    }

    async sanitize(input: string) {
        return input;
    }
}
```

## Standard Schema support

Every `ValSan` instance, including custom classes, implements
[Standard Schema v1](https://standardschema.dev/) through its `~standard`
property. This allows a custom ValSan to be used directly with libraries that accept Standard Schema.

`ArrayValSan` and `ObjectValSan` can also use Standard Schema validators as nested schemas.

### Typed inputs, outputs, and options

Object and array validators infer child input/output types, including foreign Standard Schema transformations. Object keys whose value type includes `undefined` are optional; `null` alone does not make a key optional.

The fourth `ValSan` generic and third `ComposedValSan` generic describe constructor options. Supply a precise option type to make Standard Schema nullability reflect `isNullable`, `isUndefinable`, and `isOptional`, including explicit `false` overrides. For example:

```typescript
class RequiredText extends ValSan<
  string, string, string, Record<string, never>
> {
  // Implement validate() and sanitize() as usual.
}
```

Its Standard Schema output is `string`, not `string | null | undefined`. Existing classes using the default broad options type retain conservative Standard Schema output types. When extending an option-aware built-in with a custom constructor, forward its actual option type through the generic rather than using the built-in's empty-options default. Never mutate schema configuration after construction.

`SchemaInput`, `SchemaOutput`, and `SchemaValue` are exported type helpers. The first two support native validators and Standard Schemas; the last applies the option-dependent null/undefined union to a value type. Supported JSON Schema primitives and containers retain literal constructor options automatically.

## JSON Schema extension API

ValSan and ComposedValSan expose `~standard.jsonSchema.input(options)` and `~standard.jsonSchema.output(options)` for Standard JSON Schema consumers.
Conversion is synchronous, supports `draft-07` and `draft-2020-12`, and throws for validators that do not define a conversion.

Provide explicit definitions when a custom validator or transforming pipeline cannot be converted automatically:

```typescript
const validator = new MyValSan({
  jsonSchema: {
    input: { type: 'string', description: 'Name before normalization' },
    output: { type: 'string', description: 'Normalized name' },
  },
});
```

Alternatively, override `protected jsonSchemaDefinition(direction, options)`.
It returns a JSON Schema object for the non-null value; the shared exporter
applies runtime nullability options and checks the target. Explicit
`options.jsonSchema` definitions take precedence over the hook.

### Deriving constraints from rules

For simple validators, shared derivation uses `type` for both input and output.
Optional `inputType` and `outputType` independently override that default and
accept a single type or a readonly union of types. These declarations describe
JSON wire values, not TypeScript generics or conversion logic.

Every rule must declare either a recognized constraint `kind` with typed `context`, or explicit `jsonSchema` metadata:

```typescript
override type = 'number' as const;
override inputType = ['number', 'string'] as const;

override rules() {
  return {
    minimum: {
      code: 'minimum',
      kind: 'number.minimum' as const,
      context: { min: 10 },
      user: {
        helperText: 'At least 10',
        errorMessage: 'Value must be at least 10',
      },
    },
  };
}
```

Recognized kinds derive constraints directly from context:

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
| `string.emailDomains` | `{ allowedDomains: readonly string[] \| undefined }` | Checks whether domain restrictions are representable |

```typescript
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

The exported `Rule` and `RuleSet` types enforce context for these kinds.
Custom rules may instead provide explicit `jsonSchema` metadata, which takes precedence over kind-based derivation. Shared derivation supports `minimum`, `maximum`, `minLength`, and `maxLength`, checks their values, and combines repeated bounds using the strongest constraint. An unbounded `maxLength: Infinity` is omitted.

Type-checking rules use `kind: 'type.string'`, `'type.number'`,
`'type.integer'`, or `'type.boolean'`. These checks add no constraints beyond
the declared wire types. They may check an intermediate value in a transforming
pipeline; the validator's `inputType`, `outputType`, and `type` remain the source
of wire shapes and must accurately describe the transformation.

For runtime behavior intentionally represented only by wire types, declare
`jsonSchema: 'type-only'`. For example, string-to-boolean conversion exports
string input and boolean output without encoding accepted boolean spellings.
This explicitly acknowledges an approximation, not an equivalent validator.
Runtime validation remains necessary. Prefer explicit constraints or conversion
hooks when that behavior is representable. Empty rule metadata
(`jsonSchema: {}`) is rejected; use a recognized kind or `'type-only'` instead.

Derivation is explicit: it never guesses from rule codes, helper text, or
unstructured `context`. Missing metadata, unknown kinds, invalid context bounds,
and unsupported constraints throw.
Only opt in when all listed rules are applied conjunctively to the normalized
value and their constraints correctly describe the output. Different input and
output types export differing input branches as shape only; normalized-value constraints apply to the output and matching input branches. A numeric input branch with a sole integer output also receives the integer constraint. Objects, arrays, and specialized validators retain their conversion hooks.

Custom value-preserving validators may override the
`jsonSchemaPreservesInput` getter to return `true`, allowing their constraints
to participate in `allOf` composition. Only do this if normalization and
sanitization leave the input unchanged. Subclasses that change a built-in's
validation or transformation must also update its export definition and
value-preservation metadata.

Input and output definitions are independent: a string-to-number conversion
has a string input schema and a number output schema. JSON Schema cannot run
transformations, encode undefined/bigint/Date values, or fully represent arbitrary
async checks. Keep runtime validation enabled and provide meaningful wire
representations rather than hiding unsupported behavior behind an empty schema.

## Naming Conventions

- Use `Sanitizer` for pure transformations (e.g. `TrimSanitizer`)
- Use `Validator` for pure validation (e.g. `MinLengthValidator`)
- Use `ValSan` for classes that both validate and transform (e.g. `StringToNumberValSan`)

## Guidelines for New Primitives

When creating new primitives, follow these guidelines:

1. **Choose the right postfix** based on the primary behavior
2. **Be specific** in the prefix (e.g., `MinLength` not just `Length`)
3. **Export with the same name** as the class
4. **Document the behavior** clearly in JSDoc comments
5. **Add an example** by overriding the `example` property
