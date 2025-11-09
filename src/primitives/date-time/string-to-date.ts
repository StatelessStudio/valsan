import { ValSan, ValidationResult } from '../../valsan';

/**
 * Converts a string to a Date object.
 *
 * Validates that the string represents a valid date before conversion.
 * Accepts ISO 8601 format and any format parseable by the Date constructor.
 *
 * @example
 * ```typescript
 * const validator = new StringToDateValSan();
 * const result = await validator.run('2024-01-15');
 * // result.success === true, result.data instanceof Date
 * ```
 *
 * @example Invalid input
 * ```typescript
 * const validator = new StringToDateValSan();
 * const result = await validator.run('not a date');
 * // result.success === false
 * // result.errors[0].code === 'INVALID_DATE'
 * ```
 */
export class StringToDateValSan extends ValSan<string, Date> {
	override async normalize(input: string): Promise<Date> {
		return new Date(input);
	}

	async validate(input: Date): Promise<ValidationResult> {
		if (input.toString() === 'Invalid Date') {
			return {
				isValid: false,
				errors: [
					{
						code: 'INVALID_DATE',
						message: 'Input must be a valid date string',
					},
				],
			};
		}
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: Date): Promise<Date> {
		return input;
	}
}
