import { ValSan, ValidationResult, ValidationError } from '../../valsan';

export class PortNumberValSan extends ValSan<number | string, number> {
	protected override async normalize(
		input: string | number
	): Promise<number> {
		if (typeof input === 'string') {
			const trimmed = input.trim();
			const num = Number(trimmed);

			return num;
		}

		return input;
	}

	protected async validate(input: number): Promise<ValidationResult> {
		const errors: ValidationError[] = [];
		if (!Number.isInteger(input) || input < 0 || input > 65535) {
			errors.push({
				code: 'INVALID_PORT',
				message: 'Port number must be an integer between 0 and 65535',
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	protected async sanitize(input: number): Promise<number> {
		return input;
	}
}
