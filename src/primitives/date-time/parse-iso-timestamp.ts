import { isValidCalendarDate } from './is-valid-calendar-date';

const isoTimestampPattern =
	// eslint-disable-next-line max-len
	/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;

export function parseIsoTimestamp(input: string): Date | undefined {
	const value = input.trim();
	const match = isoTimestampPattern.exec(value);
	if (!match) {
		return undefined;
	}

	const calendarDate = match[1];
	const hour = match[2];
	const minute = match[3];
	const second = match[4];
	const offsetHour = match[8];
	const offsetMinute = match[9];

	if (
		!isValidCalendarDate(calendarDate) ||
		Number(hour) > 23 ||
		Number(minute) > 59 ||
		(second !== undefined && Number(second) > 59) ||
		(offsetHour !== undefined && Number(offsetHour) > 23) ||
		(offsetMinute !== undefined && Number(offsetMinute) > 59)
	) {
		return undefined;
	}

	return new Date(value);
}
