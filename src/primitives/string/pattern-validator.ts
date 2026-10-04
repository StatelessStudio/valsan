import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
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
export class PatternValidator<
	const TOptions extends PatternValidatorOptions = PatternValidatorOptions,
> extends ValSan<string, string, string, TOptions> {
	public override get jsonSchemaPreservesInput(): boolean {
		return true;
	}

	override type: ValSanTypes = 'string';
	override title = 'Pattern-matched string';
	override description =
		'A string matching the configured regular expression.';
	private readonly pattern: RegExp;
	private readonly errorMessage?: string;

	constructor(options: TOptions) {
		super(options);
		this.pattern = new RegExp(options.pattern);
		this.errorMessage = options.errorMessage;
	}

	override rules() {
		return {
			string: stringRule,
			pattern: {
				kind: 'string.pattern' as const,
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
					regex: this.pattern,
				},
			},
		};
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		this.pattern.lastIndex = 0;
		if (!this.pattern.test(input)) {
			return this.fail([this.rules().pattern]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
