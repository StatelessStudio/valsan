export function isNumeric(value: unknown): boolean {
	return (
		typeof value === 'number' ||
		typeof value === 'string' ||
		typeof value === 'bigint'
	);
}
