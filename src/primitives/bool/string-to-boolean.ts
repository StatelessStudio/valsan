import { ValSan, ValidationResult, ValSanOptions } from '../../';
import { ValSanTypes } from '../../types/types';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

export interface StringToBooleanValSanOptions extends ValSanOptions {
	/**
	 * Values that should be considered true (case-insensitive).
	 * @default ['true', '1', 'yes', 'on']
	 */
	trueValues?: string[];

	/**
	 * Values that should be considered false (case-insensitive).
	 * @default ['false', '0', 'no', 'off']
	 */
	falseValues?: string[];
}

/**
 * Converts a string to a boolean.
 *
 * By default, recognizes common boolean string representations:
 * - True: 'true', '1', 'yes', 'on'
 * - False: 'false', '0', 'no', 'off'
 *
 * Comparison is case-insensitive.
 *
 * @example
 * ```typescript
 * const validator = new StringToBooleanValSan();
 * const result = await validator.run('YES');
 * // result.success === true, result.data === true
 * ```
 *
 * @example Custom values
 * ```typescript
 * const validator = new StringToBooleanValSan({
 *   trueValues: ['y', 'yes'],
 *   falseValues: ['n', 'no']
 * });
 * const result = await validator.run('y');
 * // result.success === true, result.data === true
 * ```
 *
 * @example Invalid input
 * ```typescript
 * const validator = new StringToBooleanValSan();
 * const result = await validator.run('maybe');
 * // result.success === false
 * // result.errors[0].code === 'boolean'
 * ```
 */
export class StringToBooleanValSan<
	const TOptions extends StringToBooleanValSanOptions = Record<string, never>,
> extends ValSan<string, boolean, string | boolean, TOptions> {
	override inputType = 'string' as const;

	override type: ValSanTypes = 'boolean';
	override title = 'Boolean string';
	override description =
		'A string representing true or false, such as "true", "false", "1", ' +
		'or "0".';
	override example = 'true';

	private readonly trueValues: string[];
	private readonly falseValues: string[];

	override rules() {
		return {
			string: stringRule,
			booleanString: {
				code: 'boolean',
				jsonSchema: 'type-only' as const,
				user: {
					helperText: 'True or false',
					errorMessage: 'Input must be true or false',
				},
				dev: {
					helperText:
						'Boolean string (true/false, 1/0, yes/no, on/off)',
					errorMessage: 'Input must be a valid boolean string',
				},
				context: {
					trueValues: this.trueValues,
					falseValues: this.falseValues,
				},
			},
		};
	}

	constructor(options: TOptions = {} as TOptions) {
		super(options);
		this.trueValues = (
			options.trueValues ?? ['true', '1', 'yes', 'on']
		).map((v) => v.toLowerCase());
		this.falseValues = (
			options.falseValues ?? ['false', '0', 'no', 'off']
		).map((v) => v.toLowerCase());
	}

	override async normalize(input: string): Promise<string> {
		return typeof input === 'string' ? input.toLowerCase() : input;
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (
			!this.trueValues.includes(input) &&
			!this.falseValues.includes(input)
		) {
			return this.fail([this.rules().booleanString]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<boolean> {
		return this.trueValues.includes(input);
	}
}
