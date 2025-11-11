import { ValSan, ValidationResult } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';
import { isString } from './is-string';

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
		if (!isString(input)) {
			return validationError([
				{
					code: 'NOT_A_STRING',
					message: 'Input must be a string',
				},
			]);
		}

		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input.toUpperCase();
	}
}
