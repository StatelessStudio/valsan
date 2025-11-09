import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';

export interface PatternValidatorOptions extends ValSanOptions {
	/**
	 * Regular expression pattern that the string must match.
	 */
	pattern: RegExp;

	/**
	 * Custom error message when pattern doesn't match.
	 */
	errorMessage?: string;
}

/**
 * Validates that a string matches a regular expression pattern.
 *
 * Does not modify the input string.
 *
 * @example
 * ```typescript
 * const validator = new PatternValidator({
 *   pattern: /^[A-Z]+$/,
 *   errorMessage: 'Must contain only uppercase letters'
 * });
 * const result = await validator.run('Hello');
 * // result.success === false
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new PatternValidator({ pattern: /^\d{3}-\d{4}$/ });
 * const result = await validator.run('123-4567');
 * // result.success === true, result.data === '123-4567'
 * ```
 */
export class PatternValidator extends ValSan<string, string> {
	private readonly pattern: RegExp;
	private readonly errorMessage?: string;

	constructor(options: PatternValidatorOptions) {
		super(options);
		this.pattern = options.pattern;
		this.errorMessage = options.errorMessage;
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!this.pattern.test(input)) {
			return {
				isValid: false,
				errors: [
					{
						code: 'STRING_PATTERN_MISMATCH',
						message:
							this.errorMessage ??
							'Input does not match required pattern',
						context: {
							pattern: this.pattern.toString(),
						},
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
		return input;
	}
}
