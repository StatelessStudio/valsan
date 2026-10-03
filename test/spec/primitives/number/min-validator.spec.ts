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

	it('normalizes supported numeric inputs to numbers', async () => {
		const validator = new MinValidator({ min: 0 });
		const stringResult = await validator.run('42');
		const bigintResult = await validator.run(42n);

		expect(stringResult.success).toBe(true);
		expect(stringResult.data).toBe(42);
		expect(typeof stringResult.data).toBe('number');
		expect(bigintResult.success).toBe(true);
		expect(bigintResult.data).toBe(42);
	});

	it('rejects inexact bigint inputs', async () => {
		const validator = new MinValidator({ min: 0 });
		const result = await validator.run(
			9007199254740993n
		);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});

	it('rejects blank numeric strings', async () => {
		const validator = new MinValidator({ min: 0 });
		const result = await validator.run('  ');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});

	it('rejects bigint inputs that overflow number conversion', async () => {
		const validator = new MinValidator({ min: 0 });
		const result = await validator.run(10n ** 400n);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
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
