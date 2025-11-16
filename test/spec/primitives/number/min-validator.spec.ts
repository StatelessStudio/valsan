import 'jasmine';
import { MinValidator } from '../../../../src';

describe('MinValidator', () => {
	it('should accept numbers meeting minimum', async () => {
		const validator = new MinValidator({ min: 0 });
		const result = await validator.run(5);
		expect(result.success).toBe(true);
		expect(result.data).toBe(5);
	});

	it('should accept numbers at exact minimum', async () => {
		const validator = new MinValidator({ min: 10 });
		const result = await validator.run(10);
		expect(result.success).toBe(true);
		expect(result.data).toBe(10);
	});

	it('should reject numbers below minimum', async () => {
		const validator = new MinValidator({ min: 0 });
		const result = await validator.run(-5);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('minimum');
		expect(result.errors[0].context?.['min']).toBe(0);
	});

	it('should reject undefined input', async () => {
		const validator = new MinValidator({ min: 0 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should work with negative minimums', async () => {
		const validator = new MinValidator({ min: -10 });
		const result1 = await validator.run(-5);
		const result2 = await validator.run(-15);
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
	});

	it('should work with decimal numbers', async () => {
		const validator = new MinValidator({ min: 1.5 });
		const result1 = await validator.run(2.5);
		const result2 = await validator.run(1.0);
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
	});

	it('should reject non-number input', async () => {
		const validator = new MinValidator({ min: 0 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run('not a number' as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});
});
