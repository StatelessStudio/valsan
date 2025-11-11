import { validationError, validationSuccess } from '../../errors';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';

export class UrlValSan extends ValSan<string, string> {
	protected override async normalize(input: string): Promise<string> {
		return input?.trim();
	}

	protected async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return validationError([
				{
					code: 'INVALID_URL',
					message: 'URL must be a string',
				},
			]);
		}

		try {
			// URL constructor throws on invalid URLs
			new URL(input);
		}
		catch {
			return validationError([
				{
					code: 'INVALID_URL',
					message: 'Invalid URL format',
				},
			]);
		}

		return validationSuccess();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
