/**
 * Validates and sanitizes input as an ISO 8601 timestamp string.
 * Accepts Date or string input. Returns a valid ISO 8601 string if possible.
 */
/**
 * Validates and sanitizes input as an ISO 8601 timestamp string.
 * Accepts Date or string input. Returns a valid ISO 8601 string if possible.
 */
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';

export class Iso8601TimestampValSan extends ValSan<string | Date, Date> {
	protected static readonly iso8601Regex =
		// eslint-disable-next-line max-len
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

	override rules() {
		return {
			stringOrDate: {
				code: 'string_or_date',
				user: {
					helperText: 'Date/time',
					errorMessage: 'Input must be Date and Time',
				},
				dev: {
					helperText: 'Timestamp string',
					errorMessage: 'Input must be a ISO 8601 string',
				},
			},
			iso8601: {
				code: 'iso8601',
				user: {
					helperText: 'Timestamp format',
					errorMessage: 'Input must be a valid timestamp format',
				},
				dev: {
					helperText: 'ISO 8601 format',
					errorMessage: 'Input must be a valid ISO 8601 timestamp',
				},
			},
		};
	}

	async validate(input: string | Date): Promise<ValidationResult> {
		if (!isString(input) && !(input instanceof Date)) {
			return this.fail([this.rules().stringOrDate]);
		}

		if (input instanceof Date && !isNaN(input.getTime())) {
			return this.pass();
		}

		if (
			typeof input === 'string' &&
			Iso8601TimestampValSan.iso8601Regex.test(input)
		) {
			return this.pass();
		}

		return this.fail([this.rules().iso8601]);
	}

	async sanitize(input: string | Date): Promise<Date> {
		if (!(input instanceof Date)) {
			return new Date(input);
		}

		return input;
	}
}
