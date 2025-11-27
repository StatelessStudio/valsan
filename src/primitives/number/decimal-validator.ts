import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { numberRule } from './number-rules';

export interface DecimalValidatorOptions extends ValSanOptions {
	/**
	 * Maximum number of decimal places allowed.
	 * If not specified, allows any number of decimal places.
	 * @default undefined
	 */
	maxDecimalPlaces?: number;

	/**
	 * Exact number of decimal places required.
	 * If specified, the number must have exactly this many decimal places.
	 * Takes precedence over maxDecimalPlaces.
	 * @default undefined
	 */
	decimalPlaces?: number;
}

/**
 * Validates that a number is a decimal (has decimal places).
 * Optionally validates the number of decimal places.
 *
 * Does not modify the input number.
 *
 * @example
 * ```typescript
 * const validator = new DecimalValidator();
 * const result = await validator.run(3.14);
 * // result.success === true, result.data === 3.14
 * ```
 *
 * @example Integer rejected
 * ```typescript
 * const validator = new DecimalValidator();
 * const result = await validator.run(42);
 * // result.success === false
 * // result.errors[0].code === 'decimal'
 * ```
 *
 * @example With max decimal places
 * ```typescript
 * const validator = new DecimalValidator({ maxDecimalPlaces: 2 });
 * const result = await validator.run(3.14);
 * // result.success === true, result.data === 3.14
 *
 * const fail = await validator.run(3.14159);
 * // fail.success === false
 * // fail.errors[0].code === 'max_decimal_places'
 * ```
 *
 * @example With exact decimal places
 * ```typescript
 * const validator = new DecimalValidator({ decimalPlaces: 2 });
 * const result = await validator.run(3.14);
 * // result.success === true, result.data === 3.14
 *
 * const fail = await validator.run(3.1);
 * // fail.success === false
 * // fail.errors[0].code === 'exact_decimal_places'
 * ```
 */
export class DecimalValidator extends ValSan<number | string, number> {
	override type: ValSanTypes = 'number';
	override example = '3.14';

	private readonly maxDecimalPlaces?: number;
	private readonly decimalPlaces?: number;

	constructor(options?: DecimalValidatorOptions) {
		super(options);
		this.maxDecimalPlaces = options?.maxDecimalPlaces;
		this.decimalPlaces = options?.decimalPlaces;
	}

	override rules() {
		const maxDecMsg = 'Number must have at most ' +
			this.maxDecimalPlaces + ' decimal places';
		const exactDecMsg = 'Number must have exactly ' +
			this.decimalPlaces + ' decimal places';
		const maxDecHelper = 'Maximum ' +
			this.maxDecimalPlaces + ' decimal places';
		const exactDecHelper = 'Exactly ' +
			this.decimalPlaces + ' decimal places';

		return {
			number: numberRule,
			decimal: {
				code: 'decimal',
				user: {
					helperText: 'Decimal number',
					errorMessage: 'Number must be a decimal ' +
						'(have decimal places)',
				},
			},
			maxDecimalPlaces: {
				code: 'max_decimal_places',
				user: {
					helperText: maxDecHelper,
					errorMessage: maxDecMsg,
				},
				context: {
					maxDecimalPlaces: this.maxDecimalPlaces,
				},
			},
			exactDecimalPlaces: {
				code: 'exact_decimal_places',
				user: {
					helperText: exactDecHelper,
					errorMessage: exactDecMsg,
				},
				context: {
					decimalPlaces: this.decimalPlaces,
				},
			},
		};
	}

	private getDecimalPlaces(num: number): number {
		const str = num.toString();
		const dotIndex = str.indexOf('.');
		if (dotIndex === -1) {
			return 0;
		}
		// Return the number of digits after the decimal point
		return str.length - dotIndex - 1;
	}

	async validate(input: number | string): Promise<ValidationResult> {
		if (typeof input !== 'number' || isNaN(input)) {
			return this.fail([this.rules().number]);
		}

		const decimalCount = this.getDecimalPlaces(input);

		// Check if it's a decimal (has decimal places)
		if (decimalCount === 0) {
			return this.fail([this.rules().decimal]);
		}

		// Check exact decimal places if specified
		if (this.decimalPlaces !== undefined) {
			if (decimalCount !== this.decimalPlaces) {
				return this.fail([this.rules().exactDecimalPlaces]);
			}
		}

		// Check max decimal places if specified and no exact requirement
		if (
			this.decimalPlaces === undefined &&
			this.maxDecimalPlaces !== undefined
		) {
			if (decimalCount > this.maxDecimalPlaces) {
				return this.fail([this.rules().maxDecimalPlaces]);
			}
		}

		return this.pass();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
