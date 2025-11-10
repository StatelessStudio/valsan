import { ValidationError, ValidationResult } from '../valsan';

export function validationError(errors: ValidationError[]): ValidationResult {
	return {
		isValid: false,
		errors,
	};
}
