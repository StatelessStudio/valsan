# Primitives Reference

ValSan provides a comprehensive library of primitive validators that can be used standalone or composed together to create complex validation pipelines.

## Bool Primitives

### StringToBooleanValSan
Converts a string to a boolean, supporting common boolean representations.

```typescript
import { StringToBooleanValSan } from 'valsan'; // from 'valsan/bool'

const validator = new StringToBooleanValSan();
const result = await validator.run('yes');
// result.data === true

// Default true values: 'true', '1', 'yes', 'on' (case-insensitive)
// Default false values: 'false', '0', 'no', 'off' (case-insensitive)

// Custom values
const custom = new StringToBooleanValSan({
  trueValues: ['y', 'yes'],
  falseValues: ['n', 'no']
});
```

## DateTime Primitives

### StringToDateValSan
Converts a string to a Date object, validating that it's a valid date string.

```typescript
import { StringToDateValSan } from 'valsan'; // from 'valsan/date-time'

const validator = new StringToDateValSan();
const result = await validator.run('2024-01-15');
// result.data instanceof Date === true
```

## String Primitives

### TrimSanitizer
Removes leading and trailing whitespace from strings.

```typescript
import { TrimSanitizer } from 'valsan';

const validator = new TrimSanitizer();
const result = await validator.run('  hello  ');
// result.data === 'hello'
```

### LowercaseSanitizer
Converts strings to lowercase. By default, rejects empty strings.

```typescript
import { LowercaseSanitizer } from 'valsan';

const validator = new LowercaseSanitizer();
const result = await validator.run('HELLO');
// result.data === 'hello'

// Allow empty strings
const optionalLowercase = new LowercaseSanitizer({ isOptional: true });
```

### UppercaseSanitizer
Converts strings to uppercase. By default, rejects empty strings.

```typescript
import { UppercaseSanitizer } from 'valsan';

const validator = new UppercaseSanitizer();
const result = await validator.run('hello');
// result.data === 'HELLO'
```

### MinLengthValidator
Validates that a string meets a minimum length requirement.

```typescript
import { MinLengthValidator } from 'valsan';

const validator = new MinLengthValidator({ minLength: 3 });
const result = await validator.run('hi');
// result.success === false
// result.errors[0].code === 'STRING_TOO_SHORT'
```

### MaxLengthValidator
Validates that a string does not exceed a maximum length.

```typescript
import { MaxLengthValidator } from 'valsan';

const validator = new MaxLengthValidator({ maxLength: 10 });
const result = await validator.run('this is way too long');
// result.success === false
// result.errors[0].code === 'STRING_TOO_LONG'
```

### PatternValidator
Validates that a string matches a regular expression pattern.

```typescript
import { PatternValidator } from 'valsan';

const validator = new PatternValidator({
  pattern: /^\d{3}-\d{4}$/,
  errorMessage: 'Must be in format: XXX-XXXX'
});
const result = await validator.run('123-4567');
// result.success === true
```

## Number Primitives

### StringToNumberValSan
Converts a string to a number, validating that it's a valid numeric string.

```typescript
import { StringToNumberValSan } from 'valsan'; // from 'valsan/number'

const validator = new StringToNumberValSan();
const result = await validator.run('42');
// result.data === 42 (number type)
```

### MinValidator
Validates that a number meets a minimum value requirement.

```typescript
import { MinValidator } from 'valsan';

const validator = new MinValidator({ min: 0 });
const result = await validator.run(-5);
// result.success === false
// result.errors[0].code === 'NUMBER_TOO_SMALL'
```

### MaxValidator
Validates that a number does not exceed a maximum value.

```typescript
import { MaxValidator } from 'valsan';

const validator = new MaxValidator({ max: 100 });
const result = await validator.run(150);
// result.success === false
// result.errors[0].code === 'NUMBER_TOO_LARGE'
```

### RangeValidator
Validates that a number falls within a specified range.

```typescript
import { RangeValidator } from 'valsan';

const validator = new RangeValidator({ min: 0, max: 100 });
const result = await validator.run(50);
// result.success === true
```

### IntegerValidator
Validates that a number is an integer (no decimal places).

```typescript
import { IntegerValidator } from 'valsan';

const validator = new IntegerValidator();
const result = await validator.run(3.14);
// result.success === false
// result.errors[0].code === 'NUMBER_NOT_INTEGER'
```

## Error Codes

All primitives use consistent, descriptive error codes:

### Bool Errors
- `INVALID_BOOLEAN` - String is not a recognized boolean value

### DateTime Errors
- `INVALID_DATE` - String cannot be converted to a valid date

### String Errors
- `EMPTY_STRING` - String is empty when empty strings are not allowed
- `STRING_TOO_SHORT` - String is shorter than minimum length
- `STRING_TOO_LONG` - String exceeds maximum length
- `STRING_PATTERN_MISMATCH` - String doesn't match required pattern

### Number Errors
- `NOT_A_NUMBER` - String cannot be converted to a number
- `NUMBER_TOO_SMALL` - Number is less than minimum value
- `NUMBER_TOO_LARGE` - Number exceeds maximum value
- `NUMBER_OUT_OF_RANGE` - Number is outside the allowed range
- `NUMBER_NOT_INTEGER` - Number has decimal places when integer required

## Composing Primitives

Primitives are designed to be composed together using `ComposedValSan`:

```typescript
import { 
  ComposedValSan, 
  TrimSanitizer, 
  LowercaseSanitizer, 
  MinLengthValidator,
  MaxLengthValidator,
  PatternValidator 
} from 'valsan';

// Username validator: trim, lowercase, length check, pattern match
class UsernameValSan extends ComposedValSan<string, string> {
  constructor() {
    super([
      new TrimSanitizer(),
      new LowercaseSanitizer(),
      new MinLengthValidator({ minLength: 3 }),
      new MaxLengthValidator({ maxLength: 20 }),
      new PatternValidator({ 
        pattern: /^[a-z0-9_]+$/ 
      })
    ]);
  }
}

const validator = new UsernameValSan();
const result = await validator.run('  John_Doe123  ');
// result.data === 'john_doe123'
// result.success === true
```

## More Examples

See the [examples directory](../examples/) for more comprehensive usage examples:
- `examples/index.ts` - Basic composed validator examples
- `examples/primitives.ts` - Showcase of all primitive validators
