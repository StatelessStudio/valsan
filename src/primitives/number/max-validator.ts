import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { isNumeric } from './is-numeric';
import { numberRule } from './number-rules';

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
 * // result.errors[0].code === 'maximum'
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

	override rules() {
		return {
			number: numberRule,
			max: {
				code: 'maximum',
				user: {
					helperText: `Maximum: ${this.max}`,
					errorMessage: `Number must be at most ${this.max}`,
				},
				context: {
					max: this.max,
				},
			},
		};
	}

	constructor(options: MaxValidatorOptions) {
		super(options);
		this.max = options.max;
	}

	async validate(input: number): Promise<ValidationResult> {
		if (!isNumeric(input)) {
			return this.fail([this.rules().number]);
		}
		if (input > this.max) {
			return this.fail([this.rules().max]);
		}
		return this.pass();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
