import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';

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
		return {
			isValid,
			errors: isValid
				? []
				: [
					{
						code: 'ENUM_INVALID',
						message:
								'Value must be one of: ' +
								this.allowedValues.join(', '),
						context: {
							allowedValues: this.allowedValues,
							received: input,
						},
					},
				],
		};
	}

	protected async sanitize(input: T): Promise<T> {
		return input;
	}
}
