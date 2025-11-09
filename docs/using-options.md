# Using Options (Quick)

Pass options to any validator or sanitizer via the constructor:

```typescript
import { MinLengthValidator } from 'valsan';
const minLen = new MinLengthValidator({ minLength: 5 });
await minLen.run('hi'); // fails
```

You can use options to:
- Set validation rules (e.g. min/max)
- Control normalization (e.g. trim, lowercase)
- Pass dependencies (e.g. database)

All options are optional and have sensible defaults. See validator docs for details.
