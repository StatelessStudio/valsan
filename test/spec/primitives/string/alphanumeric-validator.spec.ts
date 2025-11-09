import 'jasmine';
import { AlphanumericValidator } from '../../../../src/primitives/string';

describe('AlphanumericValidator', () => {
	const validator = new AlphanumericValidator();

	it('should succeed for alphanumeric strings', async () => {
		const validInputs = ['abc123', 'A1B2C3', '123456', 'abcDEF'];
		for (const input of validInputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(true);
			expect(result.errors.length).toBe(0);
			if (result.success) {
				expect(result.data).toBe(input);
			}
		}
	});

	it('should fail for strings with special characters', async () => {
		const invalidInputs = ['abc-123', 'abc 123', 'abc_123', '!@#'];
		for (const input of invalidInputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('STRING_NOT_ALPHANUMERIC');
			}
		}
	});

	it('should fail for empty string', async () => {
		const result = await validator.run('');
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors[0].code).toBe('STRING_NOT_ALPHANUMERIC');
		}
	});

	it('should fail for non-string values', async () => {
		const invalidInputs = [123, null, undefined, {}];
		for (const input of invalidInputs) {
			// @ts-expect-error: testing invalid input types
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('STRING_NOT_ALPHANUMERIC');
			}
		}
	});

	it('should use custom error message if provided', async () => {
		const customMsg = 'Only letters and numbers allowed!';
		const customValidator = new AlphanumericValidator({
			errorMessage: customMsg,
		});
		const result = await customValidator.run('abc-123');
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors[0].message).toBe(customMsg);
		}
	});
});
