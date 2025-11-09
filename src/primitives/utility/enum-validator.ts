import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';

export interface EnumValidatorOptions<T> extends ValSanOptions {
	/**
	 * Array of allowed values for the enum validator.
	 */
	allowedValues: readonly T[];
}

export class EnumValidator<T> extends ValSan<T, T> {
	protected readonly allowedValues: readonly T[];

	constructor(options: EnumValidatorOptions<T>) {
		super(options);
		this.allowedValues = options.allowedValues;
	}

	protected async validate(input: T): Promise<ValidationResult> {
		const isValid = this.allowedValues.includes(input);
		if (isValid) {
			return validationSuccess();
		}

		return validationError([
			{
				code: 'ENUM_INVALID',
				message:
					'Value must be one of: ' + this.allowedValues.join(', '),
				context: {
					allowedValues: this.allowedValues,
					received: input,
				},
			},
		]);
	}

	protected async sanitize(input: T): Promise<T> {
		return input;
	}
}
