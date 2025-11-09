/**
 * Validates and sanitizes input as an ISO 8601 timestamp string.
 * Accepts Date or string input. Returns a valid ISO 8601 string if possible.
 */
/**
 * Validates and sanitizes input as an ISO 8601 timestamp string.
 * Accepts Date or string input. Returns a valid ISO 8601 string if possible.
 */
import { ValSan, ValidationResult } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';

export class Iso8601TimestampValSan extends ValSan<string | Date, Date> {
	protected static readonly iso8601Regex =
		// eslint-disable-next-line max-len
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

	async validate(input: string | Date): Promise<ValidationResult> {
		if (input instanceof Date && !isNaN(input.getTime())) {
			return validationSuccess();
		}

		if (
			typeof input === 'string' &&
			Iso8601TimestampValSan.iso8601Regex.test(input)
		) {
			return validationSuccess();
		}

		return validationError([
			{
				code: 'INVALID_ISO8601',
				message: 'Input must be a Date or valid ISO 8601 string',
			},
		]);
	}

	async sanitize(input: string | Date): Promise<Date> {
		if (!(input instanceof Date)) {
			return new Date(input);
		}

		return input;
	}
}
