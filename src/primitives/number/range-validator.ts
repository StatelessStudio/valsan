import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';
import { isNumeric } from './is-numeric';

export interface RangeValidatorOptions extends ValSanOptions {
	/**
	 * Minimum allowed value (inclusive).
	 */
	min: number;

	/**
	 * Maximum allowed value (inclusive).
	 */
	max: number;
}

/**
 * Validates that a number falls within a specified range.
 *
 * Does not modify the input number.
 *
 * @example
 * ```typescript
 * const validator = new RangeValidator({ min: 0, max: 100 });
 * const result = await validator.run(150);
 * // result.success === false
 * // result.errors[0].code === 'NUMBER_OUT_OF_RANGE'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new RangeValidator({ min: 0, max: 100 });
 * const result = await validator.run(50);
 * // result.success === true, result.data === 50
 * ```
 */
export class RangeValidator extends ValSan<number, number> {
	private readonly min: number;
	private readonly max: number;

	constructor(options: RangeValidatorOptions) {
		super(options);
		this.min = options.min;
		this.max = options.max;
	}

	async validate(input: number): Promise<ValidationResult> {
		if (!isNumeric(input)) {
			return validationError([
				{
					code: 'INVALID_NUMBER',
					message: 'Input must be a number',
				},
			]);
		}

		if (input < this.min || input > this.max) {
			return validationError([
				{
					code: 'NUMBER_OUT_OF_RANGE',
					message:
						`Number must be between ${this.min} and ` +
						`${this.max}`,
					context: {
						min: this.min,
						max: this.max,
						actual: input,
					},
				},
			]);
		}

		return validationSuccess();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
