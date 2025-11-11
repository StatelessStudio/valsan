import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';
import { isNumeric } from './is-numeric';

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
 * // result.errors[0].code === 'NUMBER_TOO_SMALL'
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

	constructor(options: MinValidatorOptions) {
		super(options);
		this.min = options.min;
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

		if (input < this.min) {
			return validationError([
				{
					code: 'NUMBER_TOO_SMALL',
					message: `Number must be at least ${this.min}`,
					context: {
						min: this.min,
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
