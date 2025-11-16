import 'jasmine';
import { RangeValidator } from '../../../../src';

describe('RangeValidator', () => {
	it('should accept numbers within range', async () => {
		const validator = new RangeValidator({ min: 0, max: 100 });
		const result = await validator.run(50);
		expect(result.success).toBe(true);
		expect(result.data).toBe(50);
	});

	it('should accept numbers at minimum bound', async () => {
		const validator = new RangeValidator({ min: 0, max: 100 });
		const result = await validator.run(0);
		expect(result.success).toBe(true);
		expect(result.data).toBe(0);
	});

	it('should accept numbers at maximum bound', async () => {
		const validator = new RangeValidator({ min: 0, max: 100 });
		const result = await validator.run(100);
		expect(result.success).toBe(true);
		expect(result.data).toBe(100);
	});

	it('should reject numbers below minimum', async () => {
		const validator = new RangeValidator({ min: 0, max: 100 });
		const result = await validator.run(-5);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number_range');
		expect(result.errors[0].context?.['min']).toBe(0);
		expect(result.errors[0].context?.['max']).toBe(100);
	});

	it('should reject undefined input', async () => {
		const validator = new RangeValidator({ min: 0, max: 100 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should reject numbers above maximum', async () => {
		const validator = new RangeValidator({ min: 0, max: 100 });
		const result = await validator.run(150);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number_range');
	});

	it('should work with negative ranges', async () => {
		const validator = new RangeValidator({ min: -10, max: -5 });
		const result1 = await validator.run(-7);
		const result2 = await validator.run(0);
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
	});

	it('should work with decimal ranges', async () => {
		const validator = new RangeValidator({ min: 0.5, max: 1.5 });
		const result1 = await validator.run(1.0);
		const result2 = await validator.run(2.0);
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
	});

	it('should reject non-number input', async () => {
		const validator = new RangeValidator({ min: 0, max: 100 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run('not a number' as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});
});
