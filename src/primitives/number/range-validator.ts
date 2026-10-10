import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isNumeric } from './is-numeric';
import { numberRule } from './number-rules';
import { normalizeNumber } from './normalize-number';

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
 * Preserves number inputs and converts numeric strings and exact bigints.
 *
 * @example
 * ```typescript
 * const validator = new RangeValidator({ min: 0, max: 100 });
 * const result = await validator.run(150);
 * // result.success === false
 * // result.errors[0].code === 'number_range'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new RangeValidator({ min: 0, max: 100 });
 * const result = await validator.run(50);
 * // result.success === true, result.data === 50
 * ```
 */
export class RangeValidator<
	const TOptions extends RangeValidatorOptions = RangeValidatorOptions,
> extends ValSan<
	number | string | bigint,
	number,
	number,
	TOptions
> {
	override inputType = ['number', 'string'] as const;

	override type: ValSanTypes = 'number';
	override title = 'Number range';
	override description =
		'A number within the configured inclusive minimum and maximum.';

	private readonly min: number;
	private readonly max: number;

	override rules() {
		return {
			number: numberRule,
			range: {
				code: 'number_range',
				kind: 'number.range' as const,
				user: {
					helperText: `Value from ${this.min} through ${this.max}.`,
					errorMessage:
						`Number must be between ${this.min} ` +
						`and ${this.max}`,
				},
				dev: {
					helperText: `Number from ${this.min} through ${this.max}.`,
					errorMessage:
						`Number must be between ${this.min} and ` +
						`${this.max}`,
				},
				context: { min: this.min, max: this.max },
			},
		};
	}

	constructor(options: TOptions) {
		super(options);
		this.min = options.min;
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
		if (input < this.min || input > this.max) {
			return this.fail([this.rules().range]);
		}
		return this.pass();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
