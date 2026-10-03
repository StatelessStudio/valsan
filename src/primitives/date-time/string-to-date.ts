import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isValidCalendarDate } from './is-valid-calendar-date';
import { parseIsoTimestamp } from './parse-iso-timestamp';

/**
 * Converts a date string, timestamp, or Date to a Date object.
 *
 * Accepts ISO calendar dates or timestamps with minutes or seconds and a
 * timezone.
 * Numeric timestamps are milliseconds since 1970-01-01T00:00:00Z.
 *
 * @example
 * ```typescript
 * const validator = new StringToDateValSan();
 * const result = await validator.run('2024-01-15');
 * // result.success === true, result.data instanceof Date
 * ```
 *
 * @example Invalid input
 * ```typescript
 * const validator = new StringToDateValSan();
 * const result = await validator.run('not a date');
 * // result.success === false
 * // result.errors[0].code === 'date'
 * ```
 */
export class StringToDateValSan extends ValSan<
	string | number | Date,
	Date,
	Date
> {
	override type: ValSanTypes = 'string';
	override format = 'date';
	override example = '2024-01-15';

	private static readonly isoDatePattern =
		/^\d{4}-\d{2}-\d{2}$/;

	override rules() {
		return {
			date: {
				code: 'date',
				user: {
					helperText: 'Date',
					errorMessage: 'Input must be a valid date',
				},
				dev: {
					helperText: 'Date string',
					errorMessage: 'Input must be a valid date string',
				},
			},
		};
	}

	override async normalize(
		input: string | number | Date
	): Promise<Date> {
		if (input instanceof Date) {
			return new Date(input.getTime());
		}

		if (typeof input === 'string') {
			const trimmed = input.trim();
			if (StringToDateValSan.isoDatePattern.test(trimmed)) {
				if (isValidCalendarDate(trimmed)) {
					return new Date(`${trimmed}T00:00:00Z`);
				}

				return new Date(Number.NaN);
			}

			return parseIsoTimestamp(trimmed) ?? new Date(Number.NaN);
		}

		if (typeof input === 'number') {
			return new Date(input);
		}

		return new Date(Number.NaN);
	}

	async validate(input: Date): Promise<ValidationResult> {
		if (Number.isNaN(input.getTime())) {
			return this.fail([this.rules().date]);
		}
		return this.pass();
	}

	async sanitize(input: Date): Promise<Date> {
		return input;
	}
}
