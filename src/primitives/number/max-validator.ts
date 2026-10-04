import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isNumeric } from './is-numeric';
import { numberRule } from './number-rules';
import { normalizeNumber } from './normalize-number';

export interface MaxValidatorOptions extends ValSanOptions {
	/**
	 * Maximum allowed value (inclusive).
	 */
	max: number;
}

/**
 * Validates that a number does not exceed a maximum value.
 *
 * Preserves number inputs and converts numeric strings and exact bigints.
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
export class MaxValidator extends ValSan<
	number | string | bigint,
	number,
	number
> {
	override inputType = ['number', 'string'] as const;

	override type: ValSanTypes = 'number';
	override title = 'Maximum value';
	override description =
		'A number no greater than the configured inclusive maximum.';

	private readonly max: number;

	override rules() {
		return {
			number: numberRule,
			max: {
				code: 'maximum',
				kind: 'number.maximum' as const,
				user: {
					helperText: `Maximum value: ${this.max}`,
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

	protected override async normalize(
		input: number | string | bigint
	): Promise<number> {
		return normalizeNumber(input);
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
