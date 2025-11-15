import { ValSan, ValidationResult } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from './is-string';
import { stringRule } from './string-rules';

/**
 * Converts a string to uppercase.
 *
 * @example
 * ```typescript
 * const sanitizer = new UppercaseSanitizer();
 * const result = await sanitizer.run('hello');
 * // result.data === 'HELLO'
 * ```
 *
 */
export class UppercaseSanitizer extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override example = 'HeLlO';

	public override rules() {
		return {
			string: stringRule,
		};
	}

	protected override async validate(
		input: string
	): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		return this.pass();
	}

	protected override async sanitize(input: string): Promise<string> {
		return input.toUpperCase();
	}
}
