import { ValSan, ValidationResult } from '../../valsan';

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
	async validate(): Promise<ValidationResult> {
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: string): Promise<string> {
		return input.trim();
	}
}
