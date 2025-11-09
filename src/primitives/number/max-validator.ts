import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';

export interface MaxValidatorOptions extends ValSanOptions {
	/**
	 * Maximum allowed value (inclusive).
	 */
	max: number;
}

/**
 * Validates that a number does not exceed a maximum value.
 *
 * Does not modify the input number.
 *
 * @example
 * ```typescript
 * const validator = new MaxValidator({ max: 100 });
 * const result = await validator.run(150);
 * // result.success === false
 * // result.errors[0].code === 'NUMBER_TOO_LARGE'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new MaxValidator({ max: 100 });
 * const result = await validator.run(50);
 * // result.success === true, result.data === 50
 * ```
 */
export class MaxValidator extends ValSan<number, number> {
	private readonly max: number;

	constructor(options: MaxValidatorOptions) {
		super(options);
		this.max = options.max;
	}

	async validate(input: number): Promise<ValidationResult> {
		if (input > this.max) {
			return {
				isValid: false,
				errors: [
					{
						code: 'NUMBER_TOO_LARGE',
						message: `Number must be at most ${this.max}`,
						context: {
							max: this.max,
							actual: input,
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

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
