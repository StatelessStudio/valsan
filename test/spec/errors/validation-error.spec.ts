import 'jasmine';
import {
	ValidationError,
	ValidationResult,
	validationError,
} from '../../../src';

describe('validationError', () => {
	it('should return a ValidationResult error', () => {
		const errors: ValidationError[] = [
			{ message: 'Field is required', code: 'REQUIRED' },
			{ message: 'Invalid email', code: 'INVALID_EMAIL' },
		];

		const result: ValidationResult = validationError(errors);

		expect(result.isValid).toBe(false);
		expect(result.errors).toBe(errors);
	});

	it('should handle an empty errors array', () => {
		const errors: ValidationError[] = [];

		const result: ValidationResult = validationError(errors);

		expect(result.isValid).toBe(false);
		expect(result.errors).toEqual([]);
	});

	it('should not mutate the input errors array', () => {
		const errors: ValidationError[] = [
			{ message: 'Error', code: 'CUSTOM_ERROR' },
		];
		const original = [...errors];

		validationError(errors);

		expect(errors).toEqual(original);
	});
});
