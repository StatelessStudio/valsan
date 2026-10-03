import 'jasmine';
import { StringToDateValSan } from '../../../../src';

describe('StringToDateValSan', () => {
	it('should convert ISO date strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('2024-01-15');
		expect(result.success).toBe(true);
		expect(result.data instanceof Date).toBe(true);
	});

	it('should convert full ISO datetime strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('2024-01-15T10:30:00Z');
		expect(result.success).toBe(true);
		expect(result.data instanceof Date).toBe(true);
	});

	it('accepts reduced-precision ISO timestamps', async () => {
		const validator = new StringToDateValSan();
		for (const [input, expected] of [
			['2024-01-15T10:30Z', '2024-01-15T10:30:00.000Z'],
			['2024-01-15T10:30+05:30', '2024-01-15T05:00:00.000Z'],
		]) {
			const result = await validator.run(input);
			expect(result.success).withContext(input).toBe(true);
			if (result.success) {
				expect(result.data.toISOString()).toBe(expected);
			}
		}
	});

	it('rejects unsupported date string formats',
		async () => {
			const validator = new StringToDateValSan();
			for (const input of [
				'January 15, 2024', 'February 30, 2025', '02/30/2025',
				'2025-2-3', '2025', '2025-02-03T12:00',
				'2025-02-03T12:00:00',
			]) {
				const result = await validator.run(input);
				expect(result.success).withContext(input).toBe(false);
				expect(result.errors[0].code).toBe('date');
			}
		});

	it('preserves timestamp conversions', async () => {
		const validator = new StringToDateValSan();
		for (const input of [0, -1, 1700000000000]) {
			const result = await validator.run(input);
			expect(result.success).withContext(String(input)).toBe(true);
			if (result.success) {
				expect(result.data.getTime()).toBe(Number(input));
			}
		}
	});

	it('rejects boolean inputs', async () => {
		const validator = new StringToDateValSan();
		for (const input of [false, true]) {
			// @ts-expect-error: testing unsupported runtime input
			const result = await validator.run(input);
			expect(result.success).withContext(String(input)).toBe(false);
			expect(result.errors[0].code).toBe('date');
		}
	});

	it('copies valid Date input', async () => {
		const validator = new StringToDateValSan();
		const input = new Date(0);
		const result = await validator.run(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.getTime()).toBe(0);
			expect(result.data).not.toBe(input);
		}
	});

	it('rejects invalid Dates and out-of-range timestamps', async () => {
		const validator = new StringToDateValSan();
		for (const input of [new Date(NaN), NaN, Infinity, 8.64e15 + 1]) {
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('date');
		}
	});

	it('should reject invalid date strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('not a date');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('date');
	});

	it('rejects unsupported input without throwing', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Symbol('date') as any
		);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('date');
	});

	it('does not invoke coercion hooks on unsupported objects', async () => {
		const validator = new StringToDateValSan();
		const valueOf = jasmine.createSpy('valueOf').and.throwError('bug');

		// @ts-expect-error: testing unsupported runtime input
		const result = await validator.run({ valueOf });

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('date');
		expect(valueOf).not.toHaveBeenCalled();
	});

	it('should reject empty strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('date');
	});

	it('should reject invalid dates like 2024-13-45', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('2024-13-45');
		expect(result.success).toBe(false);
	});

	it('rejects rolled-over ISO calendar dates', async () => {
		const validator = new StringToDateValSan();
		for (const input of [
			'2025-02-30', '2025-02-29', '1900-02-29', '2024-04-31',
			'2025-02-30T12:00:00Z', ' 2025-02-30 ',
		]) {
			const result = await validator.run(input);
			expect(result.success).withContext(input).toBe(false);
			expect(result.errors[0].code).toBe('date');
		}
	});

	it('accepts leap days and offset timestamps without changing the date',
		async () => {
			const validator = new StringToDateValSan();
			for (const input of [
				'2000-02-29', '2024-02-29', '2024-02-29T23:00:00-02:00',
				'2024-02-29T23:00-02:00',
				'2024-02-29T12:00:00.1Z', '2024-02-29T12:00:00.12Z',
			]) {
				const result = await validator.run(input);
				expect(result.success).withContext(input).toBe(true);
				if (result.success) {
					const expected = new Date(input).getTime();
					expect(result.data.getTime()).toBe(expected);
				}
			}
		});
});
