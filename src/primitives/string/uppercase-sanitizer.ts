import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';

export interface UppercaseSanitizerOptions extends ValSanOptions {
	/**
	 * If true, allows empty strings.
	 * @default false
	 */
	allowEmpty?: boolean;
}

/**
 * Converts a string to uppercase.
 *
 * By default, rejects empty strings. Use `allowEmpty: true` to allow them.
 *
 * @example
 * ```typescript
 * const sanitizer = new UppercaseSanitizer();
 * const result = await sanitizer.run('hello');
 * // result.data === 'HELLO'
 * ```
 *
 * @example With options
 * ```typescript
 * const sanitizer = new UppercaseSanitizer({ allowEmpty: true });
 * const result = await sanitizer.run('');
 * // result.success === true, result.data === ''
 * ```
 */
export class UppercaseSanitizer extends ValSan<string, string> {
	constructor(options: UppercaseSanitizerOptions = {}) {
		super(options);
	}

	protected async validate(input: string): Promise<ValidationResult> {
		const opts = this.options as UppercaseSanitizerOptions;
		const allowEmpty = opts.allowEmpty ?? false;

		if (!allowEmpty && input.length === 0) {
			return {
				isValid: false,
				errors: [
					{
						code: 'EMPTY_STRING',
						message: 'Input cannot be empty',
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
