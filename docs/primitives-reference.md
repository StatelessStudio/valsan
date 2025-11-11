# Primitives Reference

## Table of Contents

- [Auth Primitives](#auth-primitives)
  - [BearerTokenValSan](#bearertokenvalsan)
- [Bool Primitives](#bool-primitives)
  - [StringToBooleanValSan](#stringtobooleanvalsan)
- [DateTime Primitives](#datetime-primitives)
  - [StringToDateValSan](#stringtodatevalsan)
  - [Iso8601TimestampValSan](#iso8601timestampvalsan)
- [String Primitives](#string-primitives)
  - [AlphanumericValidator](#alphanumericvalidator)
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

## String Primitives

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
// failShort.errors[0].code === 'STRING_TOO_SHORT'

const failLong = await validator.run('abcdef');
// failLong.success === false
// failLong.errors[0].code === 'STRING_TOO_LONG'
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
// fail.errors[0].code === 'INVALID_BEARER_TOKEN'
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

### Bool Errors

- `INVALID_BOOLEAN` - String is not a recognized boolean value

### DateTime Errors

- `INVALID_DATE` - String cannot be converted to a valid date
- `INVALID_ISO8601` - Not a valid ISO 8601 timestamp

### String Errors

- `EMPTY_STRING` - String is empty when empty strings are not allowed
- `STRING_TOO_SHORT` - String is shorter than minimum length
- `STRING_TOO_LONG` - String exceeds maximum length
- `STRING_PATTERN_MISMATCH` - String doesn't match required pattern
- `NOT_A_STRING` - Input is not a string
- `STRING_EMAIL_INVALID` - Not a valid email address
- `STRING_EMAIL_DOMAIN_NOT_ALLOWED` - Email domain not allowed

### Number Errors

- `INVALID_NUMBER` - String cannot be converted to a number
- `NUMBER_TOO_SMALL` - Number is less than minimum value
- `NUMBER_TOO_LARGE` - Number exceeds maximum value
- `NUMBER_OUT_OF_RANGE` - Number is outside the allowed range
- `NUMBER_NOT_INTEGER` - Number has decimal places when integer required

### Network Errors

- `INVALID_IP` - Not a valid IPv4 or IPv6 address
- `INVALID_MAC` - Not a valid MAC address
- `INVALID_PORT` - Not a valid port number
- `INVALID_URL` - Not a valid URL
- `INVALID_FQDN` - Not a valid FQDN

### Utility Errors

- `ENUM_INVALID` - Value is not in the allowed set

## More Examples

See the [examples directory](../examples/) for more comprehensive usage examples:
- `examples/index.ts` - Basic composed validator examples
- `examples/primitives.ts` - Showcase of all primitive validators
