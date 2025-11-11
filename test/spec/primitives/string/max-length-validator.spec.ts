import 'jasmine';
import { MaxLengthValidator } from '../../../../src';

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

	it('should reject undefined input', async () => {
		const validator = new MaxLengthValidator({ maxLength: 10 });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_STRING');
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
