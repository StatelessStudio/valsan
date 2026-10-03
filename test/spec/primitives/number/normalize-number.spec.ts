// eslint-disable-next-line max-len
import { normalizeNumber } from '../../../../src/primitives/number/normalize-number';
import {
	DecimalValidator,
	IntegerValidator,
	MaxValidator,
	MinValidator,
	RangeValidator,
	StringToNumberValSan,
} from '../../../../src';

describe('Numeric normalization guarantees', () => {
	it('retains supported finite numeric syntax', () => {
		const cases: [string, number][] = [
			[' 42 ', 42],
			['0.1', 0.1],
			['+.5', 0.5],
			['-0.5', -0.5],
			['001.2300', 1.23],
			['10.', 10],
			['1e+3', 1000],
			['1.2300e-5', 0.0000123],
			['0e99999', 0],
			['-0', -0],
			['0x10', 16],
			['0o10', 8],
			['0b10', 2],
			['9007199254740992', 9007199254740992],
			['1000000000000000128', 1000000000000000128],
			['5e-324', Number.MIN_VALUE],
		];
		for (const [input, expected] of cases) {
			expect(normalizeNumber(input)).withContext(input).toBe(expected);
		}
	});

	it('rejects non-finite, blank, and rounded inputs', () => {
		for (const input of [
			Infinity, -Infinity, NaN, '', ' ', 'Infinity', '-Infinity',
			'1e309', '1e-400', '9007199254740993',
			'1.00000000000000001', '0x20000000000001',
			'1000000000000000100', '1e23',
			'not a number', 9007199254740993n, 10n ** 400n,
			true, [], {}, Symbol('number'),
		]) {
			const result = normalizeNumber(input);
			expect(result).withContext(String(input)).toBeNaN();
		}
	});

	it('returns numbers for exactly representable bigint values', () => {
		expect(normalizeNumber(0n)).toBe(0);
		expect(normalizeNumber(42n)).toBe(42);
		expect(normalizeNumber(9007199254740992n)).toBe(9007199254740992);
	});

	it('rejects rounded or overflowing strings across numeric validators',
		async () => {
			const validators = [
				new StringToNumberValSan(),
				new MinValidator({ min: 0 }),
				new MaxValidator({ max: 100 }),
				new RangeValidator({ min: 0, max: 100 }),
				new IntegerValidator(),
				new DecimalValidator(),
			];
			for (const validator of validators) {
				for (const input of [
					'1.00000000000000001', '9007199254740993', '1e309',
				]) {
					const result = await validator.run(input);
					expect(result.success).withContext(input).toBe(false);
					expect(result.errors[0].code).toBe('number');
				}
			}
		});
});
