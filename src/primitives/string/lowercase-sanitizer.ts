import { ValSan, ValSanOptions, ValidationResult } from '../../valsan';
import { ValSanTypes } from '../../types/types';
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
export class LowercaseSanitizer<
	const TOptions extends ValSanOptions = Record<string, never>,
> extends ValSan<string, string, string, TOptions> {
	constructor(options: TOptions = {} as TOptions) {
		super(options);
	}

	override type: ValSanTypes = 'string';
	override title = 'Lowercase string';
	override description = 'A string with all letters in lowercase.';

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
