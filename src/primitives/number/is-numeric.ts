import { normalizeNumber } from './normalize-number';

export function isNumeric(value: unknown): boolean {
	return !Number.isNaN(normalizeNumber(value));
}
