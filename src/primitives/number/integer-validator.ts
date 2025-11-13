import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { numberRule } from './number-rules';

/**
 * Validates that a number is an integer (no decimal places).
 *
 * Does not modify the input number.
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
export class IntegerValidator extends ValSan<number | string, number> {
	override type: ValSanTypes = 'number';

	override rules() {
		return {
			number: numberRule,
			integer: {
				code: 'integer',
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

	async validate(input: number | string): Promise<ValidationResult> {
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
