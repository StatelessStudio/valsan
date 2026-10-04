import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';

export interface EnumValidatorOptions<T> extends ValSanOptions {
	/**
	 * Array of allowed values for the enum validator.
	 */
	allowedValues: readonly T[];
}

export class EnumValidator<T> extends ValSan<T, T> {
	public override get jsonSchemaPreservesInput(): boolean {
		return true;
	}

	protected override jsonSchemaDefinition() {
		if (
			this.allowedValues.length === 0 ||
			!this.allowedValues.every((value) =>
				typeof value === 'string' ||
				typeof value === 'boolean' ||
				(typeof value === 'number' && Number.isFinite(value))
			)
		) {
			throw new TypeError(
				'JSON Schema enums require nonempty JSON primitive values'
			);
		}
		return { enum: [...new Set(this.allowedValues)] };
	}

	override type: ValSanTypes = 'unknown';
	override title = 'Enumeration';
	override description =
		'One of the configured allowed values.';

	protected readonly allowedValues: readonly T[];

	constructor(options: EnumValidatorOptions<T>) {
		super(options);
		this.allowedValues = options.allowedValues;
	}

	override rules() {
		return {
			enum: {
				code: 'enum',
				user: {
					helperText: 'Values: ' + this.allowedValues.join(', '),
					errorMessage:
						'Value must be one of: ' +
						this.allowedValues.join(', '),
				},
				context: {
					allowedValues: this.allowedValues,
				},
			},
		};
	}

	protected async validate(input: T): Promise<ValidationResult> {
		const isValid = this.allowedValues.includes(input);
		if (isValid) {
			return this.pass();
		}

		return this.fail([this.rules().enum]);
	}

	protected async sanitize(input: T): Promise<T> {
		return input;
	}
}
