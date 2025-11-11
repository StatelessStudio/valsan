import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';
import { isString } from './is-string';

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
		if (!isString(input)) {
			return validationError([
				{
					code: 'INVALID_STRING',
					message: 'Input must be a string',
				},
			]);
		}

		if (input.length > this.maxLength) {
			return validationError([
				{
					code: 'STRING_TOO_LONG',
					message:
						`Input must be at most ${this.maxLength} ` +
						'character(s)',
					context: {
						maxLength: this.maxLength,
						actualLength: input.length,
					},
				},
			]);
		}

		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
