import 'jasmine';
import { MaxValidator } from '../../../../src';

describe('MaxValidator', () => {
	it('should accept numbers within maximum', async () => {
		const validator = new MaxValidator({ max: 100 });
		const result = await validator.run(50);
		expect(result.success).toBe(true);
		expect(result.data).toBe(50);
	});

	it('should accept numbers at exact maximum', async () => {
		const validator = new MaxValidator({ max: 100 });
		const result = await validator.run(100);
		expect(result.success).toBe(true);
		expect(result.data).toBe(100);
	});

	it('should reject undefined input', async () => {
		const validator = new MaxValidator({ max: 100 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should reject numbers exceeding maximum', async () => {
		const validator = new MaxValidator({ max: 100 });
		const result = await validator.run(150);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('maximum');
		expect(result.errors[0].context?.['max']).toBe(100);
	});

	it('should work with negative maximums', async () => {
		const validator = new MaxValidator({ max: -5 });
		const result1 = await validator.run(-10);
		const result2 = await validator.run(0);
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
	});

	it('should work with decimal numbers', async () => {
		const validator = new MaxValidator({ max: 10.5 });
		const result1 = await validator.run(9.9);
		const result2 = await validator.run(11.0);
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
	});

	it('should reject non-number input', async () => {
		const validator = new MaxValidator({ max: 100 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run('not a number' as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});
});
