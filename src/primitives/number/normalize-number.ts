export function normalizeNumber(input: unknown): number {
	if (typeof input === 'number') {
		return input;
	}

	if (typeof input === 'string') {
		return input.trim() === '' ? Number.NaN : Number(input);
	}

	if (typeof input === 'bigint') {
		const number = Number(input);
		return Number.isFinite(number) && BigInt(number) === input
			? number
			: Number.NaN;
	}

	return Number.NaN;
}
