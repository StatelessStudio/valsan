import { ValSan, ValidationResult } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';

/**
 * Converts a string to lowercase.
 *
 *
 * @example
 * ```typescript
 * const sanitizer = new LowercaseSanitizer();
 * const result = await sanitizer.run('HELLO');
 * // result.data === 'hello'
 * ```
 *
 */
export class LowercaseSanitizer extends ValSan<string, string> {
	protected async validate(input: string): Promise<ValidationResult> {
		if (typeof input !== 'string') {
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
		return input.toLowerCase();
	}
}
