import 'jasmine';
import { validationSuccess } from '../../../src';

describe('validationSuccess', () => {
	it('should return an object with isValid true', () => {
		const result = validationSuccess();
		expect(result.isValid).toBeTrue();
	});

	it('should return an object with errors as an empty array', () => {
		const result = validationSuccess();
		expect(Array.isArray(result.errors)).toBeTrue();
		expect(result.errors.length).toBe(0);
	});
});
