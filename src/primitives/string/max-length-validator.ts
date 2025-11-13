import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from './is-string';
import { stringRule } from './string-rules';

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
 * // result.errors[0].code === 'string_max_len'
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
	override type: ValSanTypes = 'string';
	private readonly maxLength: number;

	constructor(options: MaxLengthValidatorOptions) {
		super(options);
		this.maxLength = options.maxLength;
	}

	override rules() {
		return {
			string: stringRule,
			maxLength: {
				code: 'string_max_len',
				user: {
					helperText: `Max length: ${this.maxLength}`,
					errorMessage:
						`Input must be at most ${this.maxLength} ` +
						'character(s)',
				},
				context: {
					maxLength: this.maxLength,
				},
			},
		};
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (input.length > this.maxLength) {
			return this.fail([this.rules().maxLength]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
