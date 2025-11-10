import { ValidationResult } from '../valsan';

export function validationSuccess(): ValidationResult {
	return {
		isValid: true,
		errors: [],
	};
}
