# ObjectSanitizer

The `ObjectSanitizer` class allows you to validate and sanitize the properties of an object using a schema of valsan validators. Each property in the schema is associated with a valsan validator, and the sanitizer will run each validator on the corresponding property of the input object.

## Usage

```ts
import { ObjectSanitizer } from './object-sanitizer';
import { stringValSan, emailValSan } from './primitives/string'; // Example valsan validators

const sanitizer = new ObjectSanitizer({
  username: stringValSan({ minLength: 3 }),
  email: emailValSan(),
});

const result = await sanitizer.run({
  username: 'alice',
  email: 'alice@example.com',
});

if (result.success) {
  // result.data contains the sanitized object
  console.log('Sanitized:', result.data);
} else {
  // result.errors contains validation errors
  console.error('Validation errors:', result.errors);
}
```

## Notes

- Each field in the schema is validated independently.
- Errors are collected with the field name for easier debugging.
- Only fields defined in the schema are validated; extra fields in the input are ignored.
