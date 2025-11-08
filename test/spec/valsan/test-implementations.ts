import { ValSan, ValidationResult } from '../../../src';

// Test implementation for testing the base class
export class TestValSan extends ValSan<string, string> {
	async validate(input: string): Promise<ValidationResult> {
		if (input.length < 3) {
			return {
				isValid: false,
				errors: [
					{
						code: 'TOO_SHORT',
						message: 'Input must be at least 3 characters',
						field: 'testField',
					},
				],
			};
		}
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: string): Promise<string> {
		return input.toUpperCase();
	}
}

// Test implementation with custom normalize
export class NormalizingValSan extends ValSan<string, string> {
	override async normalize(input: string): Promise<string> {
		return input.trim().toLowerCase();
	}

	async validate(input: string): Promise<ValidationResult> {
		if (input.includes('invalid')) {
			return {
				isValid: false,
				errors: [
					{
						code: 'INVALID_WORD',
						message: 'Input contains invalid word',
					},
				],
			};
		}
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}

// Test implementation with type transformation
export class TypeTransformValSan extends ValSan<string, number> {
	async validate(input: string): Promise<ValidationResult> {
		if (isNaN(Number(input))) {
			return {
				isValid: false,
				errors: [
					{
						code: 'NOT_A_NUMBER',
						message: 'Input must be a valid number',
					},
				],
			};
		}
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: string): Promise<number> {
		return Number(input);
	}
}

// Test implementation that throws during sanitization
export class ThrowingSanitizeValSan extends ValSan<string, string> {
	async validate(): Promise<ValidationResult> {
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(): Promise<string> {
		throw new Error('Sanitization error occurred');
	}
}

// Test implementation that throws non-Error during sanitization
export class ThrowingNonErrorValSan extends ValSan<string, string> {
	async validate(): Promise<ValidationResult> {
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(): Promise<string> {
		throw 'String error'; // eslint-disable-line no-throw-literal
	}
}
