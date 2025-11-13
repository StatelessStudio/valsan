import { ValSan, ValidationResult, ValSanOptions } from '../../';
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
export class StringToBooleanValSan extends ValSan<string, boolean> {
	private readonly trueValues: string[];
	private readonly falseValues: string[];

	override rules() {
		return {
			string: stringRule,
			booleanString: {
				code: 'boolean',
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

	constructor(options: StringToBooleanValSanOptions = {}) {
		super(options);
		this.trueValues = (
			options.trueValues ?? ['true', '1', 'yes', 'on']
		).map((v) => v.toLowerCase());
		this.falseValues = (
			options.falseValues ?? ['false', '0', 'no', 'off']
		).map((v) => v.toLowerCase());
	}

	override async normalize(input: string): Promise<string> {
		return input?.toLowerCase();
	}

	async validate(input: string): Promise<ValidationResult> {
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
