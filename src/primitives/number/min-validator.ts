import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { isNumeric } from './is-numeric';
import { numberRule } from './number-rules';

export interface MinValidatorOptions extends ValSanOptions {
	/**
	 * Minimum allowed value (inclusive).
	 */
	min: number;
}

/**
 * Validates that a number meets a minimum value requirement.
 *
 * Does not modify the input number.
 *
 * @example
 * ```typescript
 * const validator = new MinValidator({ min: 0 });
 * const result = await validator.run(-5);
 * // result.success === false
 * // result.errors[0].code === 'minimum'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new MinValidator({ min: 0 });
 * const result = await validator.run(10);
 * // result.success === true, result.data === 10
 * ```
 */
export class MinValidator extends ValSan<number, number> {
	private readonly min: number;

	override rules() {
		return {
			number: numberRule,
			min: {
				code: 'minimum',
				user: {
					helperText: `Minimum: ${this.min}`,
					errorMessage: `Number must be at least ${this.min}`,
				},
				context: {
					min: this.min,
				},
			},
		};
	}

	constructor(options: MinValidatorOptions) {
		super(options);
		this.min = options.min;
	}

	async validate(input: number): Promise<ValidationResult> {
		if (!isNumeric(input)) {
			return this.fail([this.rules().number]);
		}
		if (input < this.min) {
			return this.fail([this.rules().min]);
		}
		return this.pass();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
