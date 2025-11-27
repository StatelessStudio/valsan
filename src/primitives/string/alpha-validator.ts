import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from './is-string';
import { stringRule } from './string-rules';

export interface AlphaValidatorOptions extends ValSanOptions {
	/**
	 * Whether to allow spaces in the string.
	 * @default false
	 */
	allowSpaces?: boolean;
}

/**
 * Validates that a string contains only alphabetic characters (letters).
 * Supports both uppercase and lowercase letters, and spaces can
 * optionally be allowed.
 *
 * @example
 * ```typescript
 * const validator = new AlphaValidator();
 * const result = await validator.run('hello');
 * // result.success === true
 *
 * // Custom options
 * const validatorWithSpaces = new AlphaValidator({
 *   allowSpaces: true
 * });
 * const result2 = await validatorWithSpaces.run('hello world');
 * // result2.success === true
 * ```
 */
export class AlphaValidator extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override example = 'hello';

	private readonly allowSpaces: boolean;

	constructor(options?: AlphaValidatorOptions) {
		super(options);
		this.allowSpaces = options?.allowSpaces ?? false;
	}

	override rules() {
		const helperText = this.allowSpaces
			? 'Letters and spaces only'
			: 'Letters only';
		const errorMsg = this.allowSpaces
			? 'Value contains non-alphabetic characters ' +
				'(only letters and spaces allowed)'
			: 'Value contains non-alphabetic characters ' +
				'(only letters allowed)';

		return {
			string: stringRule,
			alpha: {
				code: 'alpha',
				user: {
					helperText,
					errorMessage: errorMsg,
				},
			},
		};
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		const pattern = this.allowSpaces ? /^[a-zA-Z\s]+$/ : /^[a-zA-Z]+$/;

		if (!pattern.test(input)) {
			return this.fail([this.rules().alpha]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
