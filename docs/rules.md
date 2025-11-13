# ValSan `rules()` Feature

The `rules()` method is a core feature of the ValSan validation framework. It allows each validator to declare its validation rules in a structured, discoverable way.

## What is `rules()`?
- `rules()` is a method you define on your ValSan class.
- It returns an object (a RuleSet) where each key is a rule code and each value is a Rule object.
- Each Rule describes a validation condition, error message, and optional helper text.

## Why use `rules()`?
- Discoverable rules

## Example
```typescript
class NoSpacesValSan extends ValSan<string, string> {
  override rules() {
    return {
      no_spaces: {
        code: 'no_spaces',
        user: {
          errorMessage: 'No spaces allowed',
          helperText: 'Enter a value without spaces',
        },
      },
    };
  }

  async validate(input: string) {
    if (input.includes(' ')) {
      return this.fail([this.rules().no_spaces]);
    }
    return this.pass();
  }
}
```

## Rule Object Structure
- `code`: Unique string identifier for the rule (lowercase, snake_case recommended)
- `user`: Object with `helperText` and `errorMessage` (shown to users) 
- `dev`: (optional) Object with developer-facing help text & error message

## Best Practices
- Always use lowercase, descriptive codes
- Keep error messages clear and actionable
- Use `rules()` for all dynamic error context/messages

See the main documentation for more advanced usage and patterns.
