import { ValSan, ValidationResult, ValidationError } from '../../valsan';

export class UrlValSan extends ValSan<string, string> {
	protected async validate(input: string): Promise<ValidationResult> {
		const errors: ValidationError[] = [];
		try {
			// URL constructor throws on invalid URLs
			new URL(input);
		}
		catch {
			errors.push({
				code: 'INVALID_URL',
				message: 'Invalid URL format',
			});
		}
		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	protected async sanitize(input: string): Promise<string> {
		return input.trim();
	}
}
