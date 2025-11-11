import {
	ValSan,
	ValSanOptions,
	ValidationResult,
	ComposedValSan,
	ComposedValSanOptions,
	TrimSanitizer,
	LowercaseSanitizer,
	StringToNumberValSan,
	MaxLengthValidator,
} from '../../../src';
import { validationSuccess, validationError } from '../../../src/errors';

// Test implementation for testing the base class
export class TestValSan extends ValSan<string, string> {
	async validate(input: string): Promise<ValidationResult> {
		if (input.length < 3) {
			return validationError([
				{
					code: 'TOO_SHORT',
					message: 'Input must be at least 3 characters',
					field: 'testField',
				},
			]);
		}
		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input.toUpperCase();
	}
}

// Test implementation with custom normalize
export class NormalizingValSan extends ValSan<string, string> {
	override async normalize(input: string): Promise<string> {
		return input?.trim().toLowerCase();
	}

	async validate(input: string): Promise<ValidationResult> {
		if (input.includes('invalid')) {
			return validationError([
				{
					code: 'INVALID_WORD',
					message: 'Input contains invalid word',
				},
			]);
		}
		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}

// Test implementation with type transformation
export class TypeTransformValSan extends ValSan<string, number> {
	async validate(input: string): Promise<ValidationResult> {
		if (isNaN(Number(input))) {
			return validationError([
				{
					code: 'NOT_A_NUMBER',
					message: 'Input must be a valid number',
				},
			]);
		}
		return validationSuccess();
	}

	async sanitize(input: string): Promise<number> {
		return Number(input);
	}
}

// Test implementation that throws during sanitization
export class ThrowingSanitizeValSan extends ValSan<string, string> {
	async validate(): Promise<ValidationResult> {
		return validationSuccess();
	}

	async sanitize(): Promise<string> {
		throw new Error('Sanitization error occurred');
	}
}

// Test implementation that throws non-Error during sanitization
export class ThrowingNonErrorValSan extends ValSan<string, string> {
	async validate(): Promise<ValidationResult> {
		return validationSuccess();
	}

	async sanitize(): Promise<string> {
		throw 'String error'; // eslint-disable-line no-throw-literal
	}
}

// Test implementation with simple options
interface OptionsTestOptions extends ValSanOptions {
	testOption?: string;
	prefix?: string;
}

export class OptionsTestValSan extends ValSan<string, string> {
	constructor(options: OptionsTestOptions = {}) {
		super(options);
	}

	async validate(input: string): Promise<ValidationResult> {
		if (input.length === 0) {
			return validationError([
				{
					code: 'EMPTY_INPUT',
					message: 'Input cannot be empty',
				},
			]);
		}
		return validationSuccess();
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
interface MinLengthOptions extends ValSanOptions {
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
			return validationError([
				{
					code: 'TOO_SHORT',
					message:
						'Input must be at least ' +
						this.minLength +
						' characters',
					context: {
						minLength: this.minLength,
						actualLength: input.length,
					},
				},
			]);
		}
		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}

// Test implementation with case transformation options
interface CaseTransformOptions extends ValSanOptions {
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
		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}

// Test implementation with complex nested options
interface ComplexOptions extends ValSanOptions {
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
			result = result?.trim();
		}
		if (opts.sanitization?.lowercase) {
			result = result?.toLowerCase();
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

		if (errors.length === 0) {
			return validationSuccess();
		}
		return validationError(errors);
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}

// Test implementation for piping - doubles a number
export class DoubleNumberValSan extends ValSan<number, number> {
	async validate(input: number): Promise<ValidationResult> {
		if (input < 0) {
			return validationError([
				{
					code: 'NEGATIVE_NUMBER',
					message: 'Number must be non-negative',
				},
			]);
		}
		return validationSuccess();
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
			return validationError([
				{
					code: 'INVALID_EMAIL',
					message: 'Invalid email format',
				},
			]);
		}

		return validationSuccess();
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

// Composed ValSan with options - configurable email validator
interface EmailValSanOptions extends ComposedValSanOptions {
	allowUppercase?: boolean;
	customDomain?: string;
}

export class ConfigurableEmailValSan extends ComposedValSan<string, string> {
	constructor(options: EmailValSanOptions = {}) {
		const steps: Array<
			TrimSanitizer | LowercaseSanitizer | EmailFormatValSan
		> = [new TrimSanitizer()];

		if (!options.allowUppercase) {
			steps.push(new LowercaseSanitizer());
		}

		steps.push(new EmailFormatValSan());

		super(steps, options);
	}

	// Access options to provide custom behavior
	override async run(
		input: string
	): Promise<import('../../../src').SanitizeResult<string>> {
		const result = await super.run(input);
		const opts = this.options as EmailValSanOptions;

		// If validation passed and custom domain is specified, validate domain
		if (result.success && result.data && opts.customDomain) {
			if (!result.data.endsWith(`@${opts.customDomain}`)) {
				return {
					success: false,
					errors: [
						{
							code: 'INVALID_DOMAIN',
							message:
								'Email must be from domain ' +
								`${opts.customDomain}`,
							context: { expectedDomain: opts.customDomain },
						},
					],
				};
			}
		}

		return result;
	}
}

// Composed ValSan with options - configurable number pipeline
interface NumberPipelineOptions extends ComposedValSanOptions {
	multiplier?: number;
	allowNegative?: boolean;
}

export class ConfigurableNumberPipelineValSan extends ComposedValSan<
	string,
	number
> {
	constructor(options: NumberPipelineOptions = {}) {
		const steps: Array<
			TrimSanitizer | StringToNumberValSan | DoubleNumberValSan
		> = [new TrimSanitizer(), new StringToNumberValSan()];

		if (!options.allowNegative) {
			steps.push(new DoubleNumberValSan());
		}

		super(steps, options);
	}

	override async run(
		input: string
	): Promise<import('../../../src').SanitizeResult<number>> {
		const result = await super.run(input);
		const opts = this.options as NumberPipelineOptions;

		// Apply custom multiplier if specified
		if (result.success && result.data !== undefined && opts.multiplier) {
			return {
				success: true,
				data: result.data * opts.multiplier,
				errors: [],
			};
		}

		return result;
	}
}

// Simple composed ValSan that uses options to control behavior
interface SimpleComposedOptions extends ComposedValSanOptions {
	skipTrim?: boolean;
	testValue?: string;
}

export class SimpleComposedWithOptionsValSan extends ComposedValSan<
	string,
	string
> {
	constructor(options: SimpleComposedOptions = {}) {
		const steps: Array<TrimSanitizer | LowercaseSanitizer> = [];
		if (!options.skipTrim) {
			steps.push(new TrimSanitizer());
		}
		steps.push(new LowercaseSanitizer());

		super(steps, options);
	}
}

// Composed ValSan that passes options to child steps
interface EmailWithLengthOptions extends ComposedValSanOptions {
	maxLength?: number;
	minLength?: number;
}

export class EmailWithLengthValSan extends ComposedValSan<string, string> {
	constructor(options: EmailWithLengthOptions = {}) {
		const steps: Array<
			| TrimSanitizer
			| LowercaseSanitizer
			| EmailFormatValSan
			| MinLengthValSan
			| MaxLengthValidator
		> = [new TrimSanitizer()];

		// Pass options down to child validators
		if (options.minLength !== undefined) {
			steps.push(new MinLengthValSan({ minLength: options.minLength }));
		}

		if (options.maxLength !== undefined) {
			steps.push(
				new MaxLengthValidator({ maxLength: options.maxLength })
			);
		}

		steps.push(new LowercaseSanitizer(), new EmailFormatValSan());

		super(steps, options);
	}
}
