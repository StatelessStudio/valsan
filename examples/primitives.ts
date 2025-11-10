/* eslint-disable no-console */
/**
 * This example demonstrates all the primitive validators available in ValSan.
 * Primitives are building blocks that can be used standalone or composed
 * together to create more complex validators.
 */

import {
	// Boolean primitive
	StringToBooleanValSan,
	// Date-time primitive
	StringToDateValSan,
	// String primitives
	TrimSanitizer,
	LowercaseSanitizer,
	UppercaseSanitizer,
	MinLengthValidator,
	MaxLengthValidator,
	PatternValidator,
	// Number primitives
	MinValidator,
	MaxValidator,
	RangeValidator,
	IntegerValidator,
	StringToNumberValSan,
	// Core classes
	ComposedValSan,
} from '../src';

async function runPrimitivesExamples(): Promise<void> {
	console.log('=== STRING PRIMITIVES ===\n');

	// TrimSanitizer
	console.log('1. TrimSanitizer - Remove leading/trailing whitespace');
	const trim = new TrimSanitizer();
	const trimResult = await trim.run('  hello world  ');
	console.log('  Input: "  hello world  "');
	console.log(`  Output: "${trimResult.data}"\n`);

	// LowercaseSanitizer
	console.log('2. LowercaseSanitizer - Convert to lowercase');
	const lower = new LowercaseSanitizer();
	const lowerResult = await lower.run('HELLO WORLD');
	console.log('  Input: "HELLO WORLD"');
	console.log(`  Output: "${lowerResult.data}"\n`);

	// UppercaseSanitizer
	console.log('3. UppercaseSanitizer - Convert to uppercase');
	const upper = new UppercaseSanitizer();
	const upperResult = await upper.run('hello world');
	console.log('  Input: "hello world"');
	console.log(`  Output: "${upperResult.data}"\n`);

	// MinLengthValidator
	console.log('4. MinLengthValidator - Validate minimum length');
	const minLen = new MinLengthValidator({ minLength: 5 });
	const minLenValid = await minLen.run('hello');
	const minLenInvalid = await minLen.run('hi');
	console.log('  Valid: "hello" (length 5):', minLenValid.success);
	console.log('  Invalid: "hi" (length 2):', minLenInvalid.success);
	console.log('  Error:', minLenInvalid.errors[0].message, '\n');

	// MaxLengthValidator
	console.log('5. MaxLengthValidator - Validate maximum length');
	const maxLen = new MaxLengthValidator({ maxLength: 10 });
	const maxLenValid = await maxLen.run('hello');
	const maxLenInvalid = await maxLen.run('this is too long');
	console.log('  Valid: "hello" (length 5):', maxLenValid.success);
	console.log(
		'  Invalid: "this is too long" (length 16):',
		maxLenInvalid.success
	);
	console.log('  Error:', maxLenInvalid.errors[0].message, '\n');

	// PatternValidator
	console.log('6. PatternValidator - Validate regex pattern');
	const pattern = new PatternValidator({
		pattern: /^[A-Z][a-z]+$/,
		errorMessage: 'Must be a capitalized word',
	});
	const patternValid = await pattern.run('Hello');
	const patternInvalid = await pattern.run('hello');
	console.log('  Valid: "Hello":', patternValid.success);
	console.log('  Invalid: "hello":', patternInvalid.success);
	console.log('  Error:', patternInvalid.errors[0].message, '\n');

	console.log('=== NUMBER PRIMITIVES ===\n');

	// MinValidator
	console.log('7. MinValidator - Validate minimum value');
	const minVal = new MinValidator({ min: 0 });
	const minValid = await minVal.run(5);
	const minInvalid = await minVal.run(-5);
	console.log('  Valid: 5:', minValid.success);
	console.log('  Invalid: -5:', minInvalid.success);
	console.log('  Error:', minInvalid.errors[0].message, '\n');

	// MaxValidator
	console.log('8. MaxValidator - Validate maximum value');
	const maxVal = new MaxValidator({ max: 100 });
	const maxValid = await maxVal.run(50);
	const maxInvalid = await maxVal.run(150);
	console.log('  Valid: 50:', maxValid.success);
	console.log('  Invalid: 150:', maxInvalid.success);
	console.log('  Error:', maxInvalid.errors[0].message, '\n');

	// RangeValidator
	console.log('9. RangeValidator - Validate value range');
	const range = new RangeValidator({ min: 0, max: 100 });
	const rangeValid = await range.run(50);
	const rangeInvalid = await range.run(150);
	console.log('  Valid: 50 (in range 0-100):', rangeValid.success);
	console.log('  Invalid: 150 (out of range):', rangeInvalid.success);
	console.log('  Error:', rangeInvalid.errors[0].message, '\n');

	// IntegerValidator
	console.log('10. IntegerValidator - Validate integer values');
	const integer = new IntegerValidator();
	const intValid = await integer.run(42);
	const intInvalid = await integer.run(3.14);
	console.log('  Valid: 42:', intValid.success);
	console.log('  Invalid: 3.14:', intInvalid.success);
	console.log('  Error:', intInvalid.errors[0].message, '\n');

	console.log('=== TRANSFORM PRIMITIVES ===\n');

	// StringToNumberValSan
	console.log('11. StringToNumberValSan - Convert string to number');
	const strToNum = new StringToNumberValSan();
	const strToNumValid = await strToNum.run('42');
	const strToNumInvalid = await strToNum.run('not a number');
	console.log('  Valid: "42" →', strToNumValid.data);
	console.log('  Invalid: "not a number":', strToNumInvalid.success);
	console.log('  Error:', strToNumInvalid.errors[0].message, '\n');

	// StringToDateValSan
	console.log('12. StringToDateValSan - Convert string to Date');
	const strToDate = new StringToDateValSan();
	const dateValid = await strToDate.run('2024-01-15');
	const dateInvalid = await strToDate.run('not a date');
	console.log('  Valid: "2024-01-15" →', dateValid.data);
	console.log('  Invalid: "not a date":', dateInvalid.success);
	console.log('  Error:', dateInvalid.errors[0].message, '\n');

	// StringToBooleanValSan
	console.log('13. StringToBooleanValSan - Convert string to boolean');
	const strToBool = new StringToBooleanValSan();
	const boolTrue = await strToBool.run('yes');
	const boolFalse = await strToBool.run('no');
	const boolInvalid = await strToBool.run('maybe');
	console.log('  "yes" →', boolTrue.data);
	console.log('  "no" →', boolFalse.data);
	console.log('  "maybe":', boolInvalid.success);
	console.log('  Error:', boolInvalid.errors[0].message, '\n');

	console.log('=== COMPOSING PRIMITIVES ===\n');

	// Username validator: trim, lowercase, min/max length, pattern
	console.log('14. Complex Composition - Username Validator');
	class UsernameValSan extends ComposedValSan<string, string> {
		constructor() {
			super([
				new TrimSanitizer(),
				new LowercaseSanitizer({ isOptional: false }),
				new MinLengthValidator({ minLength: 3 }),
				new MaxLengthValidator({ maxLength: 20 }),
				new PatternValidator({
					pattern: /^[a-z0-9_]+$/,
					errorMessage: 'Only lowercase letters, numbers, and _',
				}),
			]);
		}
	}

	const username = new UsernameValSan();
	const usernameValid = await username.run('  John_Doe123  ');
	const usernameInvalid = await username.run('ab');
	console.log('  Input: "  John_Doe123  "');
	console.log(`  Output: "${usernameValid.data}"`);
	console.log('  Success:', usernameValid.success);
	console.log('\n  Input: "ab" (too short)');
	console.log('  Success:', usernameInvalid.success);
	console.log('  Error:', usernameInvalid.errors[0].message, '\n');

	// Age validator: string → number, validate range
	console.log('15. Type Transform Composition - Age Validator');
	class AgeValSan extends ComposedValSan<string, number> {
		constructor() {
			super([
				new TrimSanitizer(),
				new StringToNumberValSan(),
				new IntegerValidator(),
				new RangeValidator({ min: 0, max: 120 }),
			]);
		}
	}

	const age = new AgeValSan();
	const ageValid = await age.run('  25  ');
	const ageInvalid = await age.run('150');
	console.log('  Input: "  25  "');
	console.log(
		'  Output:',
		ageValid.data,
		'(type:',
		typeof ageValid.data + ')'
	);
	console.log('  Success:', ageValid.success);
	console.log('\n  Input: "150" (out of range)');
	console.log('  Success:', ageInvalid.success);
	console.log('  Error:', ageInvalid.errors[0].message, '\n');

	console.log('=== SUMMARY ===\n');
	console.log('ValSan provides 13 primitive validators:');
	console.log('  • 6 string primitives (trim, case, length, pattern)');
	console.log('  • 4 number primitives (min, max, range, integer)');
	console.log('  • 3 transform primitives (to number, date, boolean)');
	console.log('\nThese can be composed to create complex validators!');
}

runPrimitivesExamples().catch(console.error);
