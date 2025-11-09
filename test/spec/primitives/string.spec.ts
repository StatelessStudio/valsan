import 'jasmine';
import {
	TrimSanitizer,
	UppercaseSanitizer,
	MinLengthValidator,
	MaxLengthValidator,
	PatternValidator,
} from '../../../src';

describe('String Primitives', () => {
	describe('TrimSanitizer', () => {
		it('should trim whitespace from both ends', async () => {
			const sanitizer = new TrimSanitizer();
			const result = await sanitizer.run('  hello  ');
			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should handle strings without whitespace', async () => {
			const sanitizer = new TrimSanitizer();
			const result = await sanitizer.run('hello');
			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should handle empty strings', async () => {
			const sanitizer = new TrimSanitizer();
			const result = await sanitizer.run('');
			expect(result.success).toBe(true);
			expect(result.data).toBe('');
		});
	});

	describe('UppercaseSanitizer', () => {
		it('should convert string to uppercase', async () => {
			const sanitizer = new UppercaseSanitizer();
			const result = await sanitizer.run('hello');
			expect(result.success).toBe(true);
			expect(result.data).toBe('HELLO');
		});

		it('should reject empty strings by default', async () => {
			const sanitizer = new UppercaseSanitizer();
			const result = await sanitizer.run('');
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('EMPTY_STRING');
		});

		it('should allow empty strings with allowEmpty option', async () => {
			const sanitizer = new UppercaseSanitizer({ allowEmpty: true });
			const result = await sanitizer.run('');
			expect(result.success).toBe(true);
			expect(result.data).toBe('');
		});

		it('should handle mixed case', async () => {
			const sanitizer = new UppercaseSanitizer();
			const result = await sanitizer.run('HeLLo WoRLd');
			expect(result.success).toBe(true);
			expect(result.data).toBe('HELLO WORLD');
		});
	});

	describe('MinLengthValidator', () => {
		it('should accept strings meeting minimum length', async () => {
			const validator = new MinLengthValidator({ minLength: 3 });
			const result = await validator.run('abc');
			expect(result.success).toBe(true);
			expect(result.data).toBe('abc');
		});

		it('should accept strings exceeding minimum length', async () => {
			const validator = new MinLengthValidator({ minLength: 3 });
			const result = await validator.run('abcdef');
			expect(result.success).toBe(true);
			expect(result.data).toBe('abcdef');
		});

		it('should reject strings below minimum length', async () => {
			const validator = new MinLengthValidator({ minLength: 5 });
			const result = await validator.run('hi');
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('STRING_TOO_SHORT');
			expect(result.errors[0].context?.['minLength']).toBe(5);
			expect(result.errors[0].context?.['actualLength']).toBe(2);
		});

		it('should use default minLength of 1', async () => {
			const validator = new MinLengthValidator();
			const result = await validator.run('x');
			expect(result.success).toBe(true);
		});

		it('should reject empty string with default', async () => {
			const validator = new MinLengthValidator();
			const result = await validator.run('');
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('STRING_TOO_SHORT');
		});
	});

	describe('MaxLengthValidator', () => {
		it('should accept strings within maximum length', async () => {
			const validator = new MaxLengthValidator({ maxLength: 10 });
			const result = await validator.run('hello');
			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should accept strings at exact maximum length', async () => {
			const validator = new MaxLengthValidator({ maxLength: 5 });
			const result = await validator.run('hello');
			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should reject strings exceeding maximum length', async () => {
			const validator = new MaxLengthValidator({ maxLength: 5 });
			const result = await validator.run('hello world');
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('STRING_TOO_LONG');
			expect(result.errors[0].context?.['maxLength']).toBe(5);
			expect(result.errors[0].context?.['actualLength']).toBe(11);
		});

		it('should accept empty strings', async () => {
			const validator = new MaxLengthValidator({ maxLength: 10 });
			const result = await validator.run('');
			expect(result.success).toBe(true);
		});

		it('should handle maxLength of 1', async () => {
			const validator = new MaxLengthValidator({ maxLength: 1 });
			const result1 = await validator.run('a');
			const result2 = await validator.run('ab');
			expect(result1.success).toBe(true);
			expect(result2.success).toBe(false);
			expect(result2.errors[0].message).toContain('1 character');
		});
	});

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
			expect(result.errors[0].message).toBe(
				'Must be uppercase letters only'
			);
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
			expect(result.errors[0].context?.['pattern']).toBe(
				pattern.toString()
			);
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
});
