import 'jasmine';
import {
	MinValidator,
	MaxValidator,
	RangeValidator,
	IntegerValidator,
} from '../../../src';

describe('Number Primitives', () => {
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
	});

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
	});

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
	});

	describe('IntegerValidator', () => {
		it('should accept integer numbers', async () => {
			const validator = new IntegerValidator();
			const result = await validator.run(42);
			expect(result.success).toBe(true);
			expect(result.data).toBe(42);
		});

		it('should accept zero', async () => {
			const validator = new IntegerValidator();
			const result = await validator.run(0);
			expect(result.success).toBe(true);
			expect(result.data).toBe(0);
		});

		it('should accept negative integers', async () => {
			const validator = new IntegerValidator();
			const result = await validator.run(-42);
			expect(result.success).toBe(true);
			expect(result.data).toBe(-42);
		});

		it('should reject decimal numbers', async () => {
			const validator = new IntegerValidator();
			const result = await validator.run(3.14);
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('integer');
		});

		it('should reject numbers with small decimal parts', async () => {
			const validator = new IntegerValidator();
			const result = await validator.run(42.001);
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('integer');
		});

		it('should accept large integers', async () => {
			const validator = new IntegerValidator();
			const result = await validator.run(1000000);
			expect(result.success).toBe(true);
			expect(result.data).toBe(1000000);
		});
	});
});
