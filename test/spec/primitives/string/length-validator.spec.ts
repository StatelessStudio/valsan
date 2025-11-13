import { LengthValidator } from '../../../../src/primitives/string';

describe('LengthValidator', () => {
	it('should succeed for string within min and max', async () => {
		const valSan = new LengthValidator({ minLength: 2, maxLength: 5 });
		const result = await valSan.run('abcd');
		expect(result.success).toBe(true);
		expect(result.data).toBe('abcd');
	});

	it('should fail for string shorter than min', async () => {
		const valSan = new LengthValidator({ minLength: 3, maxLength: 5 });
		const result = await valSan.run('ab');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string_min_len');
	});

	it('should fail for string longer than max', async () => {
		const valSan = new LengthValidator({ minLength: 2, maxLength: 4 });
		const result = await valSan.run('abcdef');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string_max_len');
	});

	it('should default minLength to 1 and maxLength to Infinity', async () => {
		const valSan = new LengthValidator();
		const result = await valSan.run('a');
		expect(result.success).toBe(true);
	});

	it('should allow minLength = maxLength', async () => {
		const valSan = new LengthValidator({ minLength: 3, maxLength: 3 });
		const result1 = await valSan.run('abc');
		const result2 = await valSan.run('ab');
		const result3 = await valSan.run('abcd');
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
		expect(result3.success).toBe(false);
	});
});
