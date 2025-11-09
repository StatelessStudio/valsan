import { ValSan, ValidationResult } from '../../valsan';

/**
 * Converts a string to uppercase.
 *
 * @example
 * ```typescript
 * const sanitizer = new UppercaseSanitizer();
 * const result = await sanitizer.run('hello');
 * // result.data === 'HELLO'
 * ```
 *
 */
export class UppercaseSanitizer extends ValSan<string, string> {
	protected async validate(input: string): Promise<ValidationResult> {
		if (typeof input !== 'string') {
			return {
				isValid: false,
				errors: [
					{
						code: 'NOT_A_STRING',
						message: 'Input must be a string',
					},
				],
			};
		}

		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: string): Promise<string> {
		return input.toUpperCase();
	}
}
