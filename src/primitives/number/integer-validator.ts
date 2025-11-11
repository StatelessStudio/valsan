import { validationError, validationSuccess } from '../../errors';
import { ValSan, ValidationResult } from '../../valsan';
import { isNumeric } from './is-numeric';

/**
 * Validates that a number is an integer (no decimal places).
 *
 * Does not modify the input number.
 *
 * @example
 * ```typescript
 * const validator = new IntegerValidator();
 * const result = await validator.run(3.14);
 * // result.success === false
 * // result.errors[0].code === 'NUMBER_NOT_INTEGER'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new IntegerValidator();
 * const result = await validator.run(42);
 * // result.success === true, result.data === 42
 * ```
 */
export class IntegerValidator extends ValSan<number | string, number> {
	async validate(input: number | string): Promise<ValidationResult> {
		if (!isNumeric(input)) {
			return validationError([
				{
					code: 'INVALID_NUMBER',
					message: 'Input must be a number',
				},
			]);
		}

		if (!Number.isInteger(input)) {
			return validationError([
				{
					code: 'NUMBER_NOT_INTEGER',
					message: 'Number must be an integer',
					context: {
						actual: input,
					},
				},
			]);
		}
		return validationSuccess();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
