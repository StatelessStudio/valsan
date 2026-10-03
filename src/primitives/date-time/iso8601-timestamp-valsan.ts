import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { parseIsoTimestamp } from './parse-iso-timestamp';

/**
 * Validates a Date or ISO 8601 timestamp string and returns a valid Date.
 */
export class Iso8601TimestampValSan extends ValSan<string | Date, Date> {
	override type: ValSanTypes = 'string';
	override format = 'date-time';
	override example = '2023-01-01T12:00:00Z';

	protected override async normalize(
		input: string | Date
	): Promise<string | Date> {
		if (typeof input === 'string') {
			return parseIsoTimestamp(input) ?? input.trim();
		}
		return input;
	}

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

		if (input instanceof Date && !Number.isNaN(input.getTime())) {
			return this.pass();
		}

		return this.fail([this.rules().iso8601]);
	}

	async sanitize(input: Date): Promise<Date> {
		return input;
	}
}
