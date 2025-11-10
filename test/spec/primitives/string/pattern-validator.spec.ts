import 'jasmine';
import { PatternValidator } from '../../../../src';

describe('PatternValidator', () => {
	it('should accept strings matching pattern', async () => {
		const validator = new PatternValidator({
			pattern: /^\d{3}-\d{4}$/,
		});
		const result = await validator.run('123-4567');
		expect(result.success).toBe(true);
		expect(result.data).toBe('123-4567');
	});

	it('should reject strings not matching pattern', async () => {
		const validator = new PatternValidator({
			pattern: /^\d{3}-\d{4}$/,
		});
		const result = await validator.run('abc-defg');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('STRING_PATTERN_MISMATCH');
	});

	it('should use custom error message', async () => {
		const validator = new PatternValidator({
			pattern: /^[A-Z]+$/,
			errorMessage: 'Must be uppercase letters only',
		});
		const result = await validator.run('hello');
		expect(result.success).toBe(false);
		expect(result.errors[0].message).toBe('Must be uppercase letters only');
	});

	it('should use default error message', async () => {
		const validator = new PatternValidator({
			pattern: /^[A-Z]+$/,
		});
		const result = await validator.run('hello');
		expect(result.success).toBe(false);
		expect(result.errors[0].message).toBe(
			'Input does not match required pattern'
		);
	});

	it('should include pattern in context', async () => {
		const pattern = /^[a-z]+$/;
		const validator = new PatternValidator({ pattern });
		const result = await validator.run('123');
		expect(result.success).toBe(false);
		expect(result.errors[0].context?.['pattern']).toBe(pattern.toString());
	});

	it('should handle complex patterns', async () => {
		const validator = new PatternValidator({
			pattern: /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
		});

		const valid = await validator.run('user@example.com');
		const invalid = await validator.run('not-an-email');
		expect(valid.success).toBe(true);
		expect(invalid.success).toBe(false);
	});
});
