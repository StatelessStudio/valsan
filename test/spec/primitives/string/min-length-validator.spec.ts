import 'jasmine';
import { MinLengthValidator } from '../../../../src';

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
		expect(result.errors[0].code).toBe('string_min_len');
		expect(result.errors[0].context?.['minLength']).toBe(5);
	});

	it('should reject undefined input', async () => {
		const validator = new MinLengthValidator({ minLength: 3 });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
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
		expect(result.errors[0].code).toBe('string_min_len');
	});
});
