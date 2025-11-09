import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';

export interface LowercaseSanitizerOptions extends ValSanOptions {
	/**
	 * If true, allows empty strings.
	 * @default false
	 */
	allowEmpty?: boolean;
}

/**
 * Converts a string to lowercase.
 *
 * By default, rejects empty strings. Use `allowEmpty: true` to allow them.
 *
 * @example
 * ```typescript
 * const sanitizer = new LowercaseSanitizer();
 * const result = await sanitizer.run('HELLO');
 * // result.data === 'hello'
 * ```
 *
 * @example With options
 * ```typescript
 * const sanitizer = new LowercaseSanitizer({ allowEmpty: true });
 * const result = await sanitizer.run('');
 * // result.success === true, result.data === ''
 * ```
 */
export class LowercaseSanitizer extends ValSan<string, string> {
	constructor(options: LowercaseSanitizerOptions = {}) {
		super(options);
	}

	protected async validate(input: string): Promise<ValidationResult> {
		const opts = this.options as LowercaseSanitizerOptions;
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
		return input.toLowerCase();
	}
}
