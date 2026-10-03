function canonicalDecimal(input: string): string {
	const [coefficient, exponent = '0'] = input.toLowerCase().split('e');
	const negative = coefficient.startsWith('-');
	const unsigned = coefficient.replace(/^[+-]/, '');
	const dotIndex = unsigned.indexOf('.');
	const fractionLength =
		dotIndex === -1 ? 0 : unsigned.length - dotIndex - 1;
	const digits = unsigned.replace('.', '').replace(/^0+/, '');
	if (digits === '') {
		return '0';
	}

	const significant = digits.replace(/0+$/, '');
	const scale = BigInt(exponent) - BigInt(fractionLength) +
		BigInt(digits.length - significant.length);
	return `${negative ? '-' : ''}${significant}e${scale}`;
}

export function normalizeNumber(input: unknown): number {
	if (typeof input === 'number') {
		return Number.isFinite(input) ? input : Number.NaN;
	}

	if (typeof input === 'string') {
		const trimmed = input.trim();
		const number = Number(trimmed);
		if (trimmed === '' || !Number.isFinite(number)) {
			return Number.NaN;
		}

		if (/^0[xob]/i.test(trimmed)) {
			return BigInt(trimmed) === BigInt(number) ? number : Number.NaN;
		}

		// Compare decimal values, not binary fractions, to detect rounding
		// without rejecting ordinary inputs such as "0.1".
		const converted = Number.isInteger(number)
			? String(BigInt(number))
			: String(number);
		return canonicalDecimal(trimmed) === canonicalDecimal(converted)
			? number
			: Number.NaN;
	}

	if (typeof input === 'bigint') {
		const number = Number(input);
		return Number.isFinite(number) && BigInt(number) === input
			? number
			: Number.NaN;
	}

	return Number.NaN;
}
