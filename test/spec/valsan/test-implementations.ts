import {
	ValSan,
	ValidationResult,
	ComposedValSan,
	TrimSanitizer,
	LowercaseSanitizer,
	StringToNumberValSan,
} from '../../../src';

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

// Test implementation with simple options
interface OptionsTestOptions {
	testOption?: string;
	prefix?: string;
}

export class OptionsTestValSan extends ValSan<string, string> {
	constructor(options: OptionsTestOptions = {}) {
		super(options);
	}

	async validate(input: string): Promise<ValidationResult> {
		if (input.length === 0) {
			return {
				isValid: false,
				errors: [
					{
						code: 'EMPTY_INPUT',
						message: 'Input cannot be empty',
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
		const opts = this.options as OptionsTestOptions;
		if (opts.prefix) {
			return opts.prefix + input;
		}
		return input;
	}
}

// Test implementation with minLength option
interface MinLengthOptions {
	minLength?: number;
}

export class MinLengthValSan extends ValSan<string, string> {
	private readonly minLength: number;

	constructor(options: MinLengthOptions = {}) {
		super(options);
		this.minLength = options.minLength ?? 3;
	}

	async validate(input: string): Promise<ValidationResult> {
		if (input.length < this.minLength) {
			return {
				isValid: false,
				errors: [
					{
						code: 'TOO_SHORT',
						message:
							`Input must be at least ${this.minLength} ` +
							'characters',
						context: {
							minLength: this.minLength,
							actualLength: input.length,
						},
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

// Test implementation with case transformation options
interface CaseTransformOptions {
	transform?: 'uppercase' | 'lowercase' | 'none';
}

export class CaseTransformValSan extends ValSan<string, string> {
	constructor(options: CaseTransformOptions = {}) {
		super(options);
	}

	override async normalize(input: string): Promise<string> {
		const opts = this.options as CaseTransformOptions;
		const transform = opts.transform ?? 'none';

		if (transform === 'uppercase') {
			return input.toUpperCase();
		}
		else if (transform === 'lowercase') {
			return input.toLowerCase();
		}
		return input;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async validate(input: string): Promise<ValidationResult> {
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}

// Test implementation with complex nested options
interface ComplexOptions {
	validation?: {
		minLength?: number;
		maxLength?: number;
		pattern?: RegExp;
	};
	sanitization?: {
		trim?: boolean;
		lowercase?: boolean;
	};
}

export class ComplexOptionsValSan extends ValSan<string, string> {
	constructor(options: ComplexOptions = {}) {
		super(options);
	}

	override async normalize(input: string): Promise<string> {
		const opts = this.options as ComplexOptions;
		let result = input;

		if (opts.sanitization?.trim) {
			result = result.trim();
		}
		if (opts.sanitization?.lowercase) {
			result = result.toLowerCase();
		}

		return result;
	}

	async validate(input: string): Promise<ValidationResult> {
		const opts = this.options as ComplexOptions;
		const errors = [];

		const minLength = opts.validation?.minLength ?? 0;
		const maxLength = opts.validation?.maxLength ?? Infinity;
		const pattern = opts.validation?.pattern;

		if (input.length < minLength) {
			errors.push({
				code: 'TOO_SHORT',
				message: `Input must be at least ${minLength} characters`,
				context: { minLength, actualLength: input.length },
			});
		}

		if (input.length > maxLength) {
			errors.push({
				code: 'TOO_LONG',
				message: `Input must be at most ${maxLength} characters`,
				context: { maxLength, actualLength: input.length },
			});
		}

		if (pattern && !pattern.test(input)) {
			errors.push({
				code: 'PATTERN_MISMATCH',
				message: 'Input does not match required pattern',
				context: { pattern: pattern.toString() },
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}

// Test implementation for piping - doubles a number
export class DoubleNumberValSan extends ValSan<number, number> {
	async validate(input: number): Promise<ValidationResult> {
		if (input < 0) {
			return {
				isValid: false,
				errors: [
					{
						code: 'NEGATIVE_NUMBER',
						message: 'Number must be non-negative',
					},
				],
			};
		}
		return {
			isValid: true,
			errors: [],
		};
	}

	async sanitize(input: number): Promise<number> {
		return input * 2;
	}
}

// Test implementation for ComposedValSan - validates email format
export class EmailFormatValSan extends ValSan<string, string> {
	async validate(input: string): Promise<ValidationResult> {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(input)) {
			return {
				isValid: false,
				errors: [
					{
						code: 'INVALID_EMAIL',
						message: 'Invalid email format',
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

// Composed ValSan example - Email validator
export class EmailValSan extends ComposedValSan<string, string> {
	constructor() {
		super([
			new TrimSanitizer(),
			new LowercaseSanitizer(),
			new EmailFormatValSan(),
		]);
	}
}

// Composed ValSan example - Number pipeline
export class NumberPipelineValSan extends ComposedValSan<string, number> {
	constructor() {
		super([
			new TrimSanitizer(),
			new StringToNumberValSan(),
			new DoubleNumberValSan(),
		]);
	}
}

// Composed ValSan with single step (edge case)
export class SingleStepValSan extends ComposedValSan<string, string> {
	constructor() {
		super([new TrimSanitizer()]);
	}
}
