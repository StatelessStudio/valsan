import { ValSan, ValidationResult } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from './is-string';
import { stringRule } from './string-rules';

/**
 * Trims whitespace from the beginning and end of a string.
 *
 * This is a no-op validator that always passes validation and performs
 * trimming during sanitization.
 *
 * @example
 * ```typescript
 * const sanitizer = new TrimSanitizer();
 * const result = await sanitizer.run('  hello  ');
 * // result.data === 'hello'
 * ```
 */
export class TrimSanitizer extends ValSan<string, string> {
	override type: ValSanTypes = 'string';

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
		return input?.trim();
	}
}
