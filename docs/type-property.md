# ValSan `type` property

Many ValSan validators expose a readonly `type` property indicating the semantic type the validator operates on. The value is the union type `ValSanTypes` (defined in `src/types/types.ts`) and may be one of:

- `string`
- `number`
- `boolean`
- `date`
- `array`
- `object`
- `unknown`

Why it exists

The `type` property makes it easier for UIs, editors, or higher-level code to introspect a validator and choose appropriate form controls, default sanitizers, or rendering strategies.

Examples

- `LowercaseSanitizer.type === 'string'`
- `IntegerValidator.type === 'number'`

Notes

- `ComposedValSan` implementations typically set `type` to the type of the composed steps (for example `LengthValidator.type = 'string'`).
- `EnumValidator` is generic and defaults to `'unknown'`; if you need a more specific ValSan type for an enum, you can wrap it or create a small hinting wrapper that sets `type` to `'string'` or `'number'` as appropriate.
