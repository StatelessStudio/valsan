import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';

export interface AlphanumericValidatorOptions extends ValSanOptions {
	/**
	 * Custom error message when value is not alphanumeric.
	 */
	errorMessage?: string;
}

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
	private readonly errorMessage?: string;

	constructor(options: AlphanumericValidatorOptions = {}) {
		super(options);
		this.errorMessage = options.errorMessage;
	}

	async validate(input: string): Promise<ValidationResult> {
		if (typeof input !== 'string' || !/^[a-zA-Z0-9]+$/.test(input)) {
			return validationError([
				{
					code: 'STRING_NOT_ALPHANUMERIC',
					message:
						this.errorMessage ??
						'Value must be alphanumeric (letters and numbers only)',
				},
			]);
		}

		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
