import { ValSan, ValidationResult } from '../../valsan';

/**
 * Converts a string to a number.
 *
 * Validates that the string represents a valid number before conversion.
 *
 * @example
 * ```typescript
 * const validator = new StringToNumberValSan();
 * const result = await validator.run('42');
 * // result.success === true, result.data === 42
 * ```
 *
 * @example Invalid input
 * ```typescript
 * const validator = new StringToNumberValSan();
 * const result = await validator.run('not a number');
 * // result.success === false
 * // result.errors[0].code === 'NOT_A_NUMBER'
 * ```
 */
export class StringToNumberValSan extends ValSan<string, number> {
	async validate(input: string): Promise<ValidationResult> {
		if (isNaN(Number(input))) {
			return {
				isValid: false,
				errors: [
					{
						code: 'NOT_A_NUMBER',
						message: 'Input must be a valid number',
					},
				],
			};
		}
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: string): Promise<number> {
		return Number(input);
	}
}
