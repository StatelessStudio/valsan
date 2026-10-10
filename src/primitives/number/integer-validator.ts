import { ValSanTypes } from '../../types/types';
import { ValSan, ValSanOptions, ValidationResult } from '../../valsan';
import { numberRule } from './number-rules';
import { normalizeNumber } from './normalize-number';

/**
 * Validates that a number is an integer (no decimal places).
 *
 * Preserves number inputs and converts numeric strings and exact bigints.
 *
 * @example
 * ```typescript
 * const validator = new IntegerValidator();
 * const result = await validator.run(3.14);
 * // result.success === false
 * // result.errors[0].code === 'integer'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new IntegerValidator();
 * const result = await validator.run(42);
 * // result.success === true, result.data === 42
 * ```
 */
export class IntegerValidator<
	const TOptions extends ValSanOptions = Record<string, never>,
> extends ValSan<
	number | string | bigint,
	number,
	number,
	TOptions
> {
	constructor(options: TOptions = {} as TOptions) {
		super(options);
	}

	override inputType = ['number', 'string'] as const;

	override type: ValSanTypes = 'integer';
	override title = 'Integer';
	override description =
		'An integer supplied as a number, numeric string, or exactly ' +
		'representable bigint.';
	override example = '42';

	override rules() {
		return {
			number: numberRule,
			integer: {
				code: 'integer',
				kind: 'type.integer' as const,
				user: {
					helperText: 'Integer',
					errorMessage: 'Number must be an integer',
				},
				context: {
					integer: true,
				},
			},
		};
	}

	protected override async normalize(
		input: number | string | bigint
	): Promise<number> {
		return normalizeNumber(input);
	}

	async validate(input: number): Promise<ValidationResult> {
		if (typeof input !== 'number' || isNaN(input)) {
			return this.fail([this.rules().number]);
		}

		if (!Number.isInteger(input)) {
			return this.fail([this.rules().integer]);
		}

		return this.pass();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
