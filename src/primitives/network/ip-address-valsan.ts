import { ValSan, ValidationResult, ValidationError } from '../../valsan';

const ipv4Regex =
	// eslint-disable-next-line max-len
	/^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;

export class IpAddressValSan extends ValSan<string, string> {
	protected override async normalize(input: string): Promise<string> {
		return input?.trim();
	}

	protected async validate(input: string): Promise<ValidationResult> {
		const errors: ValidationError[] = [];
		if (!(ipv4Regex.test(input) || ipv6Regex.test(input))) {
			errors.push({
				code: 'INVALID_IP',
				message: 'Invalid IP address format',
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
