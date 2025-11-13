import { ValSan, ValidationResult } from '../../valsan';
import { isString } from './is-string';
import { stringRule } from './string-rules';

/**
 * Converts a string to lowercase.
 *
 *
 * @example
 * ```typescript
 * const sanitizer = new LowercaseSanitizer();
 * const result = await sanitizer.run('HELLO');
 * // result.data === 'hello'
 * ```
 *
 */
export class LowercaseSanitizer extends ValSan<string, string> {
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
		return input.toLowerCase();
	}
}
