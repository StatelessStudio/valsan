import { isString } from '../../../../src/';

describe('isString', () => {
	it('should return true for string literals', () => {
		expect(isString('hello')).toBeTrue();
		expect(isString('')).toBeTrue();
		expect(isString(String('test'))).toBeTrue();
	});

	it('should return true for String objects', () => {
		expect(isString(new String('hello'))).toBeFalse();
	});

	it('should return false for numbers', () => {
		expect(isString(123)).toBeFalse();
		expect(isString(NaN)).toBeFalse();
		expect(isString(Infinity)).toBeFalse();
	});

	it('should return false for booleans', () => {
		expect(isString(true)).toBeFalse();
		expect(isString(false)).toBeFalse();
	});

	it('should return false for null and undefined', () => {
		expect(isString(null)).toBeFalse();
		expect(isString(undefined)).toBeFalse();
	});

	it('should return false for objects and arrays', () => {
		expect(isString({})).toBeFalse();
		expect(isString([])).toBeFalse();
		expect(isString({ a: 1 })).toBeFalse();
	});

	it('should return false for functions', () => {
		expect(isString(() => {})).toBeFalse();
		expect(isString(function () {})).toBeFalse();
	});

	it('should return false for symbols and bigints', () => {
		expect(isString(Symbol('sym'))).toBeFalse();
		expect(isString(BigInt(10))).toBeFalse();
	});
});
