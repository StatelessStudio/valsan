import { ValSan, ValidationResult } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from './is-string';
import { stringRule } from './string-rules';

/**
 * Validates that a string contains only alphanumeric characters
 * (letters and numbers).
 *
 * @example
 * ```typescript
 * const validator = new AlphanumericValidator();
 * const result = await validator.run('abc123');
 * // result.success === true
 * ```
 */
export class AlphanumericValidator extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override example = 'abc123';

	override rules() {
		return {
			string: stringRule,
			alphanumeric: {
				code: 'alphanumeric',
				user: {
					helperText: 'Alphanumeric (letters and numbers only)',
					errorMessage: 'Value is not alphanumeric',
				},
			},
		};
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (!/^[a-zA-Z0-9]+$/.test(input)) {
			return this.fail([this.rules().alphanumeric]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
