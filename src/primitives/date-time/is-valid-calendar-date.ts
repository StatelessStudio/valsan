export function isValidCalendarDate(input: string): boolean {
	const date = new Date(`${input}T00:00:00Z`);

	return !Number.isNaN(date.getTime()) &&
		date.toISOString().slice(0, 10) === input;
}
