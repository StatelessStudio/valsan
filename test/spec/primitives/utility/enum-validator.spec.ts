// eslint-disable-next-line max-len
import { EnumValidator } from '../../../../src/primitives/utility';

describe('EnumValidator', () => {
	it('should pass for allowed values', async () => {
		const validator = new EnumValidator({
			allowedValues: ['red', 'green', 'blue'] as const,
		});
		const result = await validator.run('red');
		expect(result.success).toBe(true);
		expect(result.data).toBe('red');
		expect(result.errors.length).toBe(0);
	});

	it('should fail for disallowed values', async () => {
		const validator = new EnumValidator({
			allowedValues: ['red', 'green', 'blue'] as const,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run('yellow' as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('enum');

		// Optionally check error message and context
		expect(result.errors[0].context?.['allowedValues']).toEqual([
			'red',
			'green',
			'blue',
		]);
	});

	it('should work with numbers', async () => {
		const validator = new EnumValidator({
			allowedValues: [1, 2, 3] as const,
		});
		const result = await validator.run(2);

		expect(result.success).toBe(true);
		expect(result.data).toBe(2);
	});

	it('should fail for undefined if not optional', async () => {
		const validator = new EnumValidator({
			allowedValues: ['a', 'b', 'c'] as const,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);

		expect(result.success).toBe(false);
	});

	it('should pass for undefined if optional', async () => {
		const validator = new EnumValidator({
			allowedValues: ['a', 'b', 'c'] as const,
			isOptional: true,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);

		expect(result.success).toBe(true);
		expect(result.data).toBe(undefined);
	});
});
