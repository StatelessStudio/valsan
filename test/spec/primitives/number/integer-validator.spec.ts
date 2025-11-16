import 'jasmine';
import { IntegerValidator } from '../../../../src';

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

	it('should reject undefined input', async () => {
		const validator = new IntegerValidator();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
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

	it('should reject non-number input', async () => {
		const validator = new IntegerValidator();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run('not a number' as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});
});
