import { ValSan, ValidationResult } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';
import { isString } from './is-string';

/**
 * Trims whitespace from the beginning and end of a string.
 *
 * This is a no-op validator that always passes validation and performs
 * trimming during sanitization.
 *
 * @example
 * ```typescript
 * const sanitizer = new TrimSanitizer();
 * const result = await sanitizer.run('  hello  ');
 * // result.data === 'hello'
 * ```
 */
export class TrimSanitizer extends ValSan<string, string> {
	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return validationError([
				{
					code: 'INVALID_STRING',
					message: 'Input must be a string',
				},
			]);
		}

		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input?.trim();
	}
}
