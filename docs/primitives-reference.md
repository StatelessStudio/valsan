# Primitives Reference

## Table of Contents

- [Array Primitives](#array-primitives)
  - [ArrayValSan](#arrayvalsan)
- [Auth Primitives](#auth-primitives)
  - [BearerTokenValSan](#bearertokenvalsan)
- [Bool Primitives](#bool-primitives)
  - [StringToBooleanValSan](#stringtobooleanvalsan)
- [Color Primitives](#color-primitives)
  - [HexColorValSan](#hexcolorvalsan)
- [DateTime Primitives](#datetime-primitives)
  - [StringToDateValSan](#stringtodatevalsan)
  - [Iso8601TimestampValSan](#iso8601timestampvalsan)
- [Encoding Primitives](#encoding-primitives)
  - [UuidValSan](#uuidvalsan)
  - [SemverValSan](#semvervalsan)
- [JSON Primitives](#json-primitives)
  - [JsonValSan](#jsonvalsan)
- [Object Primitives](#object-primitives)
  - [ObjectValSan](#objectvalsan)
- [String Primitives](#string-primitives)
  - [AlphaValidator](#alphavalidator)
  - [AlphanumericValidator](#alphanumericvalidator)
  - [SlugValSan](#slugvalsan)
  - [TrimSanitizer](#trimsanitizer)
  - [LowercaseSanitizer](#lowercasesanitizer)
  - [UppercaseSanitizer](#uppercasesanitizer)
  - [MinLengthValidator](#minlengthvalidator)
  - [MaxLengthValidator](#maxlengthvalidator)
  - [LengthValidator](#lengthvalidator)
  - [PatternValidator](#patternvalidator)
- [Number Primitives](#number-primitives)
  - [StringToNumberValSan](#stringtonumbervalsan)
  - [MinValidator](#minvalidator)
  - [MaxValidator](#maxvalidator)
  - [RangeValidator](#rangevalidator)
  - [IntegerValidator](#integervalidator)
- [Network Primitives](#network-primitives)
  - [IpAddressValSan](#ipaddressvalsan)
  - [MacAddressValSan](#macaddressvalsan)
  - [PortNumberValSan](#portnumbervalsan)
  - [UrlValSan](#urlvalsan)
  - [FqdnValSan](#fqdnvalsan)
- [Person Primitives](#person-primitives)
  - [EmailValidator](#emailvalidator)
- [Utility Primitives](#utility-primitives)
  - [EnumValidator](#enumvalidator)
- [Error Codes](#error-codes)
- [More Examples](#more-examples)

## Array Primitives

### ArrayValSan

Validates and sanitizes arrays, applying a schema validator to each element.

```typescript
import { ArrayValSan } from 'valsan'; // from 'valsan/array'

const emailListValidator = new ArrayValSan({
  schema: new EmailValidator()
});
const result = await emailListValidator.run([
  'user1@example.com',
  'user2@example.com'
]);
// result.success === true
// result.data === ['user1@example.com', 'user2@example.com']

// Validation error in array element
const fail = await emailListValidator.run([
  'valid@example.com',
  'invalid-email'
]);
// fail.success === false
// fail.errors[0].field === '[1]' (array index)

// Optional array
const optional = new ArrayValSan({
  schema: new IntegerValidator(),
  isOptional: true
});
const result2 = await optional.run(undefined);
// result2.success === true
// result2.data === undefined

// Array of objects with nested validation
const addressValidator = new ArrayValSan({
  schema: new ObjectValSan({
    schema: {
      street: new TrimSanitizer(),
      city: new TrimSanitizer(),
      zipCode: new PatternValidator({ pattern: /^\d{5}$/ })
    }
  })
});
```

## Bool Primitives

### StringToBooleanValSan

```typescript
import { StringToBooleanValSan } from 'valsan'; // from 'valsan/bool'

const validator = new StringToBooleanValSan();
const result = await validator.run('yes');
// result.success === true
// result.data === true

// Default true values: 'true', '1', 'yes', 'on' (case-insensitive)
// Default false values: 'false', '0', 'no', 'off' (case-insensitive)

// Custom values
const custom = new StringToBooleanValSan({
  trueValues: ['y', 'yes'],
  falseValues: ['n', 'no']
});
```

## Color Primitives

### HexColorValSan

Validates hexadecimal color codes. Supports 3-digit (#RGB), 4-digit (#RGBA), 6-digit (#RRGGBB), and 8-digit (#RRGGBBAA) formats. Input is normalized to uppercase.

```typescript
import { HexColorValSan } from 'valsan'; // from 'valsan/color'

const validator = new HexColorValSan();

// Valid 6-digit hex color
const result = await validator.run('#FF0000');
// result.success === true
// result.data === '#FF0000'

// Valid 3-digit short format
const shortResult = await validator.run('#F00');
// shortResult.success === true
// shortResult.data === '#F00'

// Valid 8-digit with alpha channel
const alphaResult = await validator.run('#FF0000FF');
// alphaResult.success === true
// alphaResult.data === '#FF0000FF'

// Valid 4-digit short format with alpha
const alphaShortResult = await validator.run('#F00F');
// alphaShortResult.success === true
// alphaShortResult.data === '#F00F'

// Lowercase is converted to uppercase
const lowerResult = await validator.run('#ff0000');
// lowerResult.success === true
// lowerResult.data === '#FF0000'

// Whitespace is trimmed
const trimResult = await validator.run('  #FF0000  ');
// trimResult.success === true
// trimResult.data === '#FF0000'

// Mixed case is normalized
const mixedResult = await validator.run('#FfAa00');
// mixedResult.success === true
// mixedResult.data === '#FFAA00'

// Invalid: missing hash
const fail = await validator.run('FF0000');
// fail.success === false
// fail.errors[0].code === 'hex_color'

// Invalid: invalid characters
const fail2 = await validator.run('#GG0000');
// fail2.success === false
// fail2.errors[0].code === 'hex_color'

// Invalid: wrong length (5 digits)
const fail3 = await validator.run('#FF000');
// fail3.success === false
// fail3.errors[0].code === 'hex_color'

```

## DateTime Primitives

### StringToDateValSan

```typescript
import { StringToDateValSan } from 'valsan'; // from 'valsan/date-time'

const validator = new StringToDateValSan();
const result = await validator.run('2024-01-15');
// result.success === true
// result.data instanceof Date === true

```

### Iso8601TimestampValSan

Validates and sanitizes input as an ISO 8601 timestamp string. Accepts Date or string input. Returns a valid ISO 8601 string if possible.

```typescript
import { Iso8601TimestampValSan } from 'valsan'; // from 'valsan/date-time'

const validator = new Iso8601TimestampValSan();
const result = await validator.run('2024-01-15T12:34:56Z');
// result.success === true
// result.data instanceof Date === true

```

## Encoding Primitives

### UuidValSan

Validates that a string is a valid UUID (RFC 4122). Supports UUID v1, v3, v4, and v5 formats. Input is normalized to lowercase.

```typescript
import { UuidValSan } from 'valsan'; // from 'valsan/encoding'

const validator = new UuidValSan();
const result = await validator.run('550e8400-e29b-41d4-a716-446655440000');
// result.success === true
// result.data === '550e8400-e29b-41d4-a716-446655440000'

// Invalid UUID
const fail = await validator.run('550e8400e29b41d4a716446655440000');
// fail.success === false
// fail.errors[0].code === 'uuid'

```

### SemverValSan

Validates that a string is a valid semantic version (SemVer 2.0.0). Supports major.minor.patch with optional prerelease and build metadata.

```typescript
import { SemverValSan } from 'valsan'; // from 'valsan/encoding'

const validator = new SemverValSan();

// Valid semantic version
const result = await validator.run('1.0.0');
// result.success === true
// result.data === '1.0.0'

// With prerelease identifier
const preResult = await validator.run('1.0.0-alpha');
// preResult.success === true
// preResult.data === '1.0.0-alpha'

// With multiple prerelease identifiers
const multiPreResult = await validator.run('1.0.0-alpha.beta.1');
// multiPreResult.success === true
// multiPreResult.data === '1.0.0-alpha.beta.1'

// With build metadata
const buildResult = await validator.run('1.0.0+build.1');
// buildResult.success === true
// buildResult.data === '1.0.0+build.1'

// With both prerelease and build
const bothResult = await validator.run('2.0.0-rc.1+build.123');
// bothResult.success === true
// bothResult.data === '2.0.0-rc.1+build.123'

// Trims whitespace
const trimResult = await validator.run('  1.0.0  ');
// trimResult.success === true
// trimResult.data === '1.0.0'

// Invalid version with leading zeros
const fail = await validator.run('01.0.0');
// fail.success === false
// fail.errors[0].code === 'semver'

```

## JSON Primitives

### JsonValSan

Validates that a string is valid JSON (RFC 8259). Parses the JSON string and returns the parsed value (object, array, string, number, boolean, or null).

```typescript
import { JsonValSan } from 'valsan'; // from 'valsan/json'

const validator = new JsonValSan();

// Valid JSON object
const result = await validator.run('{"key": "value"}');
// result.success === true
// result.data === { key: 'value' }

// Valid JSON array
const arrayResult = await validator.run('[1, 2, 3]');
// arrayResult.success === true
// arrayResult.data === [1, 2, 3]

// Valid JSON string
const stringResult = await validator.run('"hello"');
// stringResult.success === true
// stringResult.data === 'hello'

// Valid JSON number
const numberResult = await validator.run('42');
// numberResult.success === true
// numberResult.data === 42

// Valid JSON boolean
const boolResult = await validator.run('true');
// boolResult.success === true
// boolResult.data === true

// Valid JSON null
const nullResult = await validator.run('null');
// nullResult.success === true
// nullResult.data === null

// Complex nested JSON
const complexResult = await validator.run(
	'{"users": [{"id": 1, "name": "John"}]}'
);
// complexResult.success === true
// complexResult.data === { users: [{ id: 1, name: 'John' }] }

// Trims whitespace
const trimResult = await validator.run('  {"key": "value"}  ');
// trimResult.success === true
// trimResult.data === { key: 'value' }

// Invalid JSON
const fail = await validator.run('{"key": "value"');
// fail.success === false
// fail.errors[0].code === 'json'

```

## Object Primitives

### ObjectValSan

Validates and sanitizes objects, applying a schema of validators to object properties. Objects can be nested.

```typescript
import { ObjectValSan } from 'valsan'; // from 'valsan/object'

// Basic object validation
const userValidator = new ObjectValSan({
  schema: {
    name: new TrimSanitizer(),
    email: new EmailValidator(),
    age: new IntegerValidator()
  }
});

const result = await userValidator.run({
  name: '  John Doe  ',
  email: 'john@example.com',
  age: 30
});
// result.success === true
// result.data === { name: 'John Doe', email: 'john@example.com', age: 30 }

// Validation error in object property
const fail = await userValidator.run({
  name: 'Jane',
  email: 'invalid-email',
  age: 25
});
// fail.success === false
// fail.errors[0].field === 'email'

// Nested objects
const addressValidator = new ObjectValSan({
  schema: {
    street: new TrimSanitizer(),
    city: new TrimSanitizer(),
    zipCode: new PatternValidator({ pattern: /^\d{5}$/ })
  }
});

const userWithAddressValidator = new ObjectValSan({
  schema: {
    name: new TrimSanitizer(),
    email: new EmailValidator(),
    address: addressValidator
  }
});

const result2 = await userWithAddressValidator.run({
  name: '  John  ',
  email: 'john@example.com',
  address: {
    street: '  123 Main St  ',
    city: '  Springfield  ',
    zipCode: '12345'
  }
});
// result2.success === true
// result2.data.address.street === '123 Main St'

// Allow additional properties
const permissiveValidator = new ObjectValSan({
  schema: {
    name: new TrimSanitizer()
  },
  allowAdditionalProperties: true
});

const result3 = await permissiveValidator.run({
  name: 'John',
  metadata: { key: 'value' },
  count: 42
});
// result3.success === true
// result3.data.metadata === { key: 'value' }
// result3.data.count === 42

// Optional object
const optional = new ObjectValSan({
  schema: {
    name: new TrimSanitizer()
  },
  isOptional: true
});

const result4 = await optional.run(undefined);
// result4.success === true
// result4.data === undefined
```

## String Primitives

### AlphaValidator

Validates that a string contains only alphabetic characters (letters only).
Spaces can optionally be allowed by using the `allowSpaces` option.

```typescript
import { AlphaValidator } from 'valsan';

const validator = new AlphaValidator();
const result = await validator.run('hello');
// result.success === true
// result.data === 'hello'

// With numbers (fails)
const fail = await validator.run('abc123');
// fail.success === false
// fail.errors[0].code === 'alpha'

// Allow spaces
const validatorWithSpaces = new AlphaValidator({ allowSpaces: true });
const result2 = await validatorWithSpaces.run('hello world');
// result2.success === true
// result2.data === 'hello world'

// With numbers when spaces allowed (still fails)
const fail2 = await validatorWithSpaces.run('hello 123');
// fail2.success === false
// fail2.errors[0].code === 'alpha'
```

### AlphanumericValidator

Validates that a string contains only alphanumeric characters (letters and numbers).

```typescript
import { AlphanumericValidator } from 'valsan';

const validator = new AlphanumericValidator();
const result = await validator.run('abc123');
// result.success === true
// result.data === 'abc123'

const fail = await validator.run('abc-123');
// fail.success === false
// fail.errors[0].code === 'STRING_NOT_ALPHANUMERIC'

// Custom error message
const custom = new AlphanumericValidator({ errorMessage: 'Only letters and numbers allowed!' });
const fail2 = await custom.run('abc-123');
// fail2.success === false
// fail2.errors[0].message === 'Only letters and numbers allowed!'
```

### SlugValSan

Validates and sanitizes strings to slug format (lowercase, alphanumeric with
hyphens). Optionally converts strings to valid slug format.

```typescript
import { SlugValSan } from 'valsan';

const validator = new SlugValSan();
const result = await validator.run('hello-world');
// result.success === true
// result.data === 'hello-world'

// Uppercase fails
const fail = await validator.run('Hello-World');
// fail.success === false
// fail.errors[0].code === 'slug'

// Spaces are not allowed
const fail2 = await validator.run('hello world');
// fail2.success === false
// fail2.errors[0].code === 'slug'

// Auto-convert to slug format
const autoValidator = new SlugValSan({ autoConvert: true });
const result2 = await autoValidator.run('Hello World');
// result2.success === true
// result2.data === 'hello-world'

// Underscores are converted to hyphens
const result3 = await autoValidator.run('hello_world_test');
// result3.success === true
// result3.data === 'hello-world-test'

// Special characters are removed
const result4 = await autoValidator.run('Hello@World!');
// result4.success === true
// result4.data === 'helloworld'
```

### TrimSanitizer

Removes leading and trailing whitespace from strings.

```typescript
import { TrimSanitizer } from 'valsan';

const validator = new TrimSanitizer();
const result = await validator.run('  hello  ');
// result.success === true
// result.data === 'hello'

```

### LowercaseSanitizer

Converts strings to lowercase.

```typescript
import { LowercaseSanitizer } from 'valsan';

const validator = new LowercaseSanitizer();
const result = await validator.run('HELLO');
// result.success === true
// result.data === 'hello'

```

### UppercaseSanitizer

Converts strings to uppercase.

```typescript
import { UppercaseSanitizer } from 'valsan';

const validator = new UppercaseSanitizer();
const result = await validator.run('hello');
// result.success === true
// result.data === 'HELLO'

```

### MinLengthValidator

Validates that a string meets a minimum length requirement.

```typescript
import { MinLengthValidator } from 'valsan';

const validator = new MinLengthValidator({ minLength: 3 });
const result = await validator.run('hi');
// result.success === false

// result.errors[0].code === 'string_min_len'
```

### MaxLengthValidator

Validates that a string does not exceed a maximum length.

```typescript
import { MaxLengthValidator } from 'valsan';

const validator = new MaxLengthValidator({ maxLength: 10 });
const result = await validator.run('this is way too long');
// result.success === false

// result.errors[0].code === 'string_max_len'
```

### LengthValidator

Validates that a string's length is between a minimum and maximum (inclusive).

```typescript
import { LengthValidator } from 'valsan';

const validator = new LengthValidator({ minLength: 2, maxLength: 5 });
const result = await validator.run('abcd');
// result.success === true
// result.data === 'abcd'

const failShort = await validator.run('a');
// failShort.success === false
// failShort.errors[0].code === 'string_min_len'

const failLong = await validator.run('abcdef');
// failLong.success === false
// failLong.errors[0].code === 'string_max_len'
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
// result.success === true
// result.data === 42 (number type)

```

### MinValidator

Validates that a number meets a minimum value requirement.

```typescript
import { MinValidator } from 'valsan';

const validator = new MinValidator({ min: 0 });
const result = await validator.run(-5);
// result.success === false

// result.errors[0].code === 'minimum'
```

### MaxValidator

Validates that a number does not exceed a maximum value.

```typescript
import { MaxValidator } from 'valsan';

const validator = new MaxValidator({ max: 100 });
const result = await validator.run(150);
// result.success === false

// result.errors[0].code === 'maximum'
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

// result.errors[0].code === 'integer'
```

## Network Primitives

### IpAddressValSan

Validates that a string is a valid IPv4 or IPv6 address.

```typescript
import { IpAddressValSan } from 'valsan'; // from 'valsan/network'

const validator = new IpAddressValSan();
const result = await validator.run('192.168.1.1');
// result.success === true

```

### MacAddressValSan

Validates that a string is a valid MAC address.

```typescript
import { MacAddressValSan } from 'valsan'; // from 'valsan/network'

const validator = new MacAddressValSan();
const result = await validator.run('00:1A:2B:3C:4D:5E');
// result.success === true

```

### PortNumberValSan

Validates that a value is a valid TCP/UDP port number (0-65535).

```typescript
import { PortNumberValSan } from 'valsan'; // from 'valsan/network'

const validator = new PortNumberValSan();
const result = await validator.run(8080);
// result.success === true

```

### UrlValSan

Validates that a string is a valid URL.

```typescript
import { UrlValSan } from 'valsan'; // from 'valsan/network'

const validator = new UrlValSan();
const result = await validator.run('https://example.com');
// result.success === true

```

### FqdnValSan

Validates that a string is a valid fully qualified domain name (FQDN).

```typescript
import { FqdnValSan } from 'valsan'; // from 'valsan/network'

const validator = new FqdnValSan();
const result = await validator.run('example.com');
// result.success === true

```

## Person Primitives

### EmailValidator

Validates that a string is a valid email address, with options for allowed domains and plus addressing.

```typescript
import { EmailValidator } from 'valsan'; // from 'valsan/person'

const validator = new EmailValidator();
const result = await validator.run('test@example.com');
// result.success === true

```

## Auth Primitives

### BearerTokenValSan

Validates that a string is a valid HTTP Bearer token (RFC 6750).

```typescript
import { BearerTokenValSan } from 'valsan';

const validator = new BearerTokenValSan();
const result = await validator.run('mF_9.B5f-4.1JqM');
// result.success === true
// result.data === 'mF_9.B5f-4.1JqM'

const fail = await validator.run('Bearer ');
// fail.success === false
// fail.errors[0].code === 'valid_bearer_token'
```

## Utility Primitives

### EnumValidator

Validates that a value is one of a set of allowed values.

```typescript
import { EnumValidator } from 'valsan'; // from 'valsan/utility'

const validator = new EnumValidator({ allowedValues: ['red', 'green', 'blue'] });
const result = await validator.run('red');
// result.success === true

```

## Error Codes

All primitives use consistent, descriptive error codes:

### Array Errors

- `array` - Input is not an array
- `required` - Array is required but was not provided

### Object Errors

- `object` - Input is not a valid object
- `required` - Object is required but was not provided
- `unexpected_field` - Object contains a field not defined in schema

### Bool Errors

- `boolean` - String is not a recognized boolean value

### Color Errors

- `hex_color` - Not a valid hex color format
- `string` - Input is not a string

### DateTime Errors

- `date` - String cannot be converted to a valid date
- `iso8601` - Not a valid ISO 8601 timestamp

### Encoding Errors

- `uuid` - Not a valid UUID format
- `semver` - Not a valid semantic version format
- `string` - Input is not a string

### JSON Errors

- `json` - Input is not valid JSON
- `string` - Input is not a string

### String Errors

- `empty_string` - String is empty when empty strings are not allowed
- `string_min_len` - String is shorter than minimum length
- `string_max_len` - String exceeds maximum length
- `pattern` - String doesn't match required pattern
- `string` - Input is not a string
- `email_format` - Not a valid email address
- `email_domain` - Email domain not allowed

### Number Errors

- `number` - String cannot be converted to a number
- `minimum` - Number is less than minimum value
- `maximum` - Number exceeds maximum value
- `number_range` - Number is outside the allowed range
- `integer` - Number has decimal places when integer required

### Network Errors

- `ip_address` - Not a valid IPv4 or IPv6 address
- `mac` - Not a valid MAC address
- `port_number` - Not a valid port_number number
- `url` - Not a valid URL
- `fqdn` - Not a valid FQDN

### Utility Errors

- `enum` - Value is not in the allowed set

## More Examples

See the [examples directory](../examples/) for more comprehensive usage examples:
- `examples/index.ts` - Basic composed validator examples
- `examples/primitives.ts` - Showcase of all primitive validators
