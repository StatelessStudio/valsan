import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';

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
 * // result.errors[0].code === 'STRING_TOO_SHORT'
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
	private readonly minLength: number;

	constructor(options: MinLengthValidatorOptions = {}) {
		super(options);
		this.minLength = options.minLength ?? 1;
	}

	async validate(input: string): Promise<ValidationResult> {
		if (input.length < this.minLength) {
			const plural = this.minLength === 1 ? '' : 's';
			return {
				isValid: false,
				errors: [
					{
						code: 'STRING_TOO_SHORT',
						message:
							`Input must be at least ${this.minLength} ` +
							`character${plural}`,
						context: {
							minLength: this.minLength,
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
