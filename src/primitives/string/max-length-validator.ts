import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';

export interface MaxLengthValidatorOptions extends ValSanOptions {
	/**
	 * Maximum allowed length for the string.
	 */
	maxLength: number;
}

/**
 * Validates that a string does not exceed a maximum length.
 *
 * Does not modify the input string.
 *
 * @example
 * ```typescript
 * const validator = new MaxLengthValidator({ maxLength: 10 });
 * const result = await validator.run('this is too long');
 * // result.success === false
 * // result.errors[0].code === 'STRING_TOO_LONG'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new MaxLengthValidator({ maxLength: 10 });
 * const result = await validator.run('short');
 * // result.success === true, result.data === 'short'
 * ```
 */
export class MaxLengthValidator extends ValSan<string, string> {
	private readonly maxLength: number;

	constructor(options: MaxLengthValidatorOptions) {
		super(options);
		this.maxLength = options.maxLength;
	}

	async validate(input: string): Promise<ValidationResult> {
		if (input.length > this.maxLength) {
			const plural = this.maxLength === 1 ? '' : 's';
			return {
				isValid: false,
				errors: [
					{
						code: 'STRING_TOO_LONG',
						message:
							`Input must be at most ${this.maxLength} ` +
							`character${plural}`,
						context: {
							maxLength: this.maxLength,
							actualLength: input.length,
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
