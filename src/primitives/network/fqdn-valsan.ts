import { ValSan, ValidationResult, ValidationError } from '../../valsan';
import { isString } from '../string/is-string';

// RFC 1035 FQDN: labels separated by dots, each label 1-63 chars,
//  total <= 255, no leading/trailing dot
const fqdnRegex =
	// eslint-disable-next-line max-len
	/^(?=.{1,255}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export class FqdnValSan extends ValSan<string, string> {
	protected override async normalize(input: string): Promise<string> {
		return input?.trim();
	}

	protected async validate(input: string): Promise<ValidationResult> {
		const errors: ValidationError[] = [];

		if (!isString(input)) {
			errors.push({
				code: 'INVALID_FQDN',
				message: 'FQDN must be a string',
			});
		}

		if (!fqdnRegex.test(input)) {
			errors.push({
				code: 'INVALID_FQDN',
				message: 'Invalid FQDN format',
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
