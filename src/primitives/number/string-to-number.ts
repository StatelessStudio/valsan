import { ValSan, ValidationResult } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { numberRule } from './number-rules';

/**
 * Converts a string to a number.
 *
 * Validates that the string represents a valid number before conversion.
 *
 * @example
 * ```typescript
 * const validator = new StringToNumberValSan();
 * const result = await validator.run('42');
 * // result.success === true, result.data === 42
 * ```
 *
 * @example Invalid input
 * ```typescript
 * const validator = new StringToNumberValSan();
 * const result = await validator.run('not a number');
 * // result.success === false
 * // result.errors[0].code === 'number'
 * ```
 */
export class StringToNumberValSan extends ValSan<string, number> {
	override type: ValSanTypes = 'number';

	override rules() {
		return {
			number: numberRule,
		};
	}

	protected override async normalize(input: string): Promise<number> {
		return Number(input);
	}

	async validate(input: number): Promise<ValidationResult> {
		if (isNaN(input)) {
			return this.fail([this.rules().number]);
		}
		return this.pass();
	}

	async sanitize(input: number): Promise<number> {
		return input;
	}
}
