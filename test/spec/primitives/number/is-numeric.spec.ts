import { isNumeric } from '../../../../src/';

describe('isNumeric', () => {
	it('should return true for numbers', () => {
		expect(isNumeric(0)).toBeTrue();
		expect(isNumeric(123)).toBeTrue();
		expect(isNumeric(-456)).toBeTrue();
		expect(isNumeric(NaN)).toBeTrue();
		expect(isNumeric(Infinity)).toBeTrue();
	});

	it('should return true for numeric strings', () => {
		expect(isNumeric('123')).toBeTrue();
		expect(isNumeric('-456')).toBeTrue();
		expect(isNumeric('0')).toBeTrue();
		expect(isNumeric('1.23')).toBeTrue();
		expect(isNumeric('NaN')).toBeTrue();
		expect(isNumeric('Infinity')).toBeTrue();
		expect(isNumeric('')).toBeTrue();
	});

	it('should return true for bigint values', () => {
		expect(isNumeric(BigInt(123))).toBeTrue();
		expect(isNumeric(BigInt(-456))).toBeTrue();
		expect(isNumeric(0n)).toBeTrue();
	});

	it('should return false for non-numeric types', () => {
		expect(isNumeric(true)).toBeFalse();
		expect(isNumeric(false)).toBeFalse();
		expect(isNumeric(null)).toBeFalse();
		expect(isNumeric(undefined)).toBeFalse();
		expect(isNumeric({})).toBeFalse();
		expect(isNumeric([])).toBeFalse();
		expect(isNumeric(() => 123)).toBeFalse();
		expect(isNumeric(Symbol('123'))).toBeFalse();
	});
});
