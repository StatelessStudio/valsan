import 'jasmine';
import { SanitizeResult, ValidationError } from '../../../src';

describe('SanitizeResult', () => {
	it('should expose the correct fields for each result variant', () => {
		const success: SanitizeResult<string> = {
			success: true,
			data: 'sanitized',
			errors: [],
		};
		const failure: SanitizeResult<string> = {
			success: false,
			errors: [
				{
					code: 'INVALID',
					message: 'Invalid value',
				},
			],
		};

		if (success.success) {
			const data: string = success.data;
			const errors: [] = success.errors;
			expect(data).toBe('sanitized');
			expect(errors).toEqual([]);
		}

		if (!failure.success) {
			const errors: ValidationError[] = failure.errors;
			expect('data' in failure).toBe(false);
			expect(errors[0].code).toBe('INVALID');
		}
	});

	it('should reject data on failure and non-empty errors on success', () => {
		// @ts-expect-error Failure results must not include data.
		const failedWithData: SanitizeResult<string> = {
			success: false,
			data: 'unexpected',
			errors: [],
		};
		// @ts-expect-error Success results must have no errors.
		const successfulWithErrors: SanitizeResult<string> = {
			success: true,
			data: 'sanitized',
			errors: [{ code: 'INVALID', message: 'Invalid value' }],
		};

		expect(failedWithData.success).toBe(false);
		expect(successfulWithErrors.success).toBe(true);
	});
});
