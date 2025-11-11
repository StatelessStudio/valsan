import { ValSan, ValidationResult, ValidationError } from '../../valsan';
import { isString } from '../string/is-string';

// Accepts formats: 00:1A:2B:3C:4D:5E, 00-1A-2B-3C-4D-5E, 001A.2B3C.4D5E
const macRegex =
	// eslint-disable-next-line max-len
	/^([0-9A-Fa-f]{2}([-:])){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4})$/;

export class MacAddressValSan extends ValSan<string, string> {
	protected override async normalize(input: string): Promise<string> {
		return input?.trim();
	}

	protected async validate(input: string): Promise<ValidationResult> {
		const errors: ValidationError[] = [];

		if (!isString(input)) {
			errors.push({
				code: 'INVALID_MAC',
				message: 'MAC address must be a string',
			});
		}

		if (!macRegex.test(input)) {
			errors.push({
				code: 'INVALID_MAC',
				message: 'Invalid MAC address format',
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
