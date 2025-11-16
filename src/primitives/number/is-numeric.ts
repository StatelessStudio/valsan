export function isNumeric(value: unknown): boolean {
	return (
		(typeof value === 'number' ||
			typeof value === 'bigint' ||
			(typeof value === 'string' && value.length > 0)) &&
		!Number.isNaN(Number(value))
	);
}
