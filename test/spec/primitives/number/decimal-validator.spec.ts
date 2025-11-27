import 'jasmine';
import { DecimalValidator } from '../../../../src';

describe('DecimalValidator', () => {
	it('should accept decimal numbers', async () => {
		const validator = new DecimalValidator();
		const inputs = [3.14, 0.5, -2.5, 10.01, 100.999];
		for (const input of inputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(true);
			expect(result.data).toBe(input);
		}
	});

	it('should reject integers', async () => {
		const validator = new DecimalValidator();
		const inputs = [0, 1, 42, -10, 1000];
		for (const input of inputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('decimal');
			}
		}
	});

	it('should reject undefined input', async () => {
		const validator = new DecimalValidator();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should reject non-number input', async () => {
		const validator = new DecimalValidator();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run('not a number' as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});

	it('should accept very small decimals', async () => {
		const validator = new DecimalValidator();
		const result = await validator.run(0.001);
		expect(result.success).toBe(true);
		expect(result.data).toBe(0.001);
	});

	it('should accept negative decimals', async () => {
		const validator = new DecimalValidator();
		const result = await validator.run(-3.14);
		expect(result.success).toBe(true);
		expect(result.data).toBe(-3.14);
	});

	describe('with maxDecimalPlaces option', () => {
		it('should accept decimals within max places', async () => {
			const validator = new DecimalValidator({ maxDecimalPlaces: 2 });
			const inputs = [3.1, 3.14, 0.5, -2.99];
			for (const input of inputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(true);
				expect(result.data).toBe(input);
			}
		});

		it('should reject decimals exceeding max places', async () => {
			const validator = new DecimalValidator({ maxDecimalPlaces: 2 });
			const inputs = [3.141, 3.14159, 0.123];
			for (const input of inputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code)
						.toBe('max_decimal_places');
				}
			}
		});

		it('should still reject integers with maxDecimalPlaces', async () => {
			const validator = new DecimalValidator({ maxDecimalPlaces: 2 });
			const result = await validator.run(42);
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('decimal');
		});

		it('should work with maxDecimalPlaces of 1', async () => {
			const validator = new DecimalValidator({ maxDecimalPlaces: 1 });
			const result1 = await validator.run(3.1);
			expect(result1.success).toBe(true);

			const result2 = await validator.run(3.14);
			expect(result2.success).toBe(false);
			if (!result2.success) {
				expect(result2.errors[0].code)
					.toBe('max_decimal_places');
			}
		});

		it('should work with larger maxDecimalPlaces', async () => {
			const validator = new DecimalValidator({ maxDecimalPlaces: 5 });
			const result1 = await validator.run(3.14159);
			expect(result1.success).toBe(true);

			const result2 = await validator.run(3.141592);
			expect(result2.success).toBe(false);
			if (!result2.success) {
				expect(result2.errors[0].code)
					.toBe('max_decimal_places');
			}
		});
	});

	describe('with decimalPlaces option', () => {
		it('should accept exact decimal places', async () => {
			const validator = new DecimalValidator({ decimalPlaces: 2 });
			const inputs = [3.14, -2.99, 10.25, 0.99];
			for (const input of inputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(true);
				expect(result.data).toBe(input);
			}
		});

		it('should reject fewer decimal places', async () => {
			const validator = new DecimalValidator({ decimalPlaces: 2 });
			const inputs = [3.1, 0.5, -2.9];
			for (const input of inputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code)
						.toBe('exact_decimal_places');
				}
			}
		});

		it('should reject more decimal places', async () => {
			const validator = new DecimalValidator({ decimalPlaces: 2 });
			const inputs = [3.141, 0.123, -2.999];
			for (const input of inputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code)
						.toBe('exact_decimal_places');
				}
			}
		});

		it('should reject integers', async () => {
			const validator = new DecimalValidator({ decimalPlaces: 2 });
			const result = await validator.run(42);
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('decimal');
		});

		it(
			'should prioritize exact decimal places over max ' +
			'decimal places',
			async () => {
				const validator = new DecimalValidator({
					decimalPlaces: 2,
					maxDecimalPlaces: 5,
				});
				const result1 = await validator.run(3.14);
				expect(result1.success).toBe(true);

				const result2 = await validator.run(3.1);
				expect(result2.success).toBe(false);
				if (!result2.success) {
					expect(result2.errors[0].code)
						.toBe('exact_decimal_places');
				}
			}
		);

		it('should work with decimalPlaces of 1', async () => {
			const validator = new DecimalValidator({ decimalPlaces: 1 });
			const result1 = await validator.run(3.1);
			expect(result1.success).toBe(true);

			const result2 = await validator.run(3.14);
			expect(result2.success).toBe(false);
		});

		it('should work with larger decimalPlaces', async () => {
			const validator = new DecimalValidator({ decimalPlaces: 5 });
			const result1 = await validator.run(3.14159);
			expect(result1.success).toBe(true);

			const result2 = await validator.run(3.1415);
			expect(result2.success).toBe(false);
		});
	});
});
