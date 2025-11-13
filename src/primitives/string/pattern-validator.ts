import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { stringRule } from './string-rules';
import { isString } from './is-string';

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

	override rules() {
		return {
			string: stringRule,
			pattern: {
				code: 'pattern',
				user: {
					helperText: 'Pattern',
					errorMessage:
						this.errorMessage ?? 'Input format is incorrect',
				},
				dev: {
					helperText: 'Pattern: ' + this.pattern.toString(),
					errorMessage:
						this.errorMessage ?? 'Input format is incorrect',
				},
				context: {
					pattern: this.pattern.toString(),
				},
			},
		};
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (!this.pattern.test(input)) {
			return this.fail([this.rules().pattern]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
