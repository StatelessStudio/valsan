import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from './is-string';
import { stringRule } from './string-rules';

export interface MinLengthValidatorOptions extends ValSanOptions {
	/**
	 * Minimum required length for the string.
	 * @default 1
	 */
	minLength?: number;
}

/**
 * Validates that a string meets a minimum length requirement.
 *
 * Does not modify the input string.
 *
 * @example
 * ```typescript
 * const validator = new MinLengthValidator({ minLength: 3 });
 * const result = await validator.run('ab');
 * // result.success === false
 * // result.errors[0].code === 'string_min_len'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new MinLengthValidator({ minLength: 3 });
 * const result = await validator.run('abc');
 * // result.success === true, result.data === 'abc'
 * ```
 */
export class MinLengthValidator extends ValSan<string, string> {
	public override get jsonSchemaPreservesInput(): boolean {
		return true;
	}

	override type: ValSanTypes = 'string';
	override title = 'Minimum string length';
	override description =
		'A string at least as long as the configured minimum length.';
	private readonly minLength: number;

	constructor(options: MinLengthValidatorOptions = {}) {
		super(options);
		this.minLength = options.minLength ?? 1;
	}

	override rules() {
		return {
			string: stringRule,
			minLength: {
				code: 'string_min_len',
				kind: 'string.minLength' as const,
				user: {
					helperText: `Minimum length: ${this.minLength}`,
					errorMessage:
						`Input must be at least ${this.minLength} ` +
						'character(s)',
				},
				context: {
					minLength: this.minLength,
				},
			},
		};
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (input.length < this.minLength) {
			return this.fail([this.rules().minLength]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
