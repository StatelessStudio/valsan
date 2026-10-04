import { validationError } from './errors';
import { Rule } from './rules';
import { RuleSet } from './rules/rule';
import { ValSanTypes } from './types/types';
import { BaseValSan } from './valsan-base';

export interface ValidationError {
	field?: string;
	/**
	 * Path to the invalid value, using property names and array
	 * indices as separate segments
	 */
	path?: Array<string | number>;
	code: string;
	message: string;
	context?: Record<string, unknown>;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export type SanitizeResult<T> =
	| {
		success: true;
		data: T;
		errors: [];
	}
	| {
		success: false;
		data?: never;
		errors: ValidationError[];
	};

export interface ValSanOptions {
	/**
	 * Human-readable title for schema documentation and JSON Schema output.
	 */
	title?: string;
	/**
	 * Human-readable description for schema documentation and JSON Schema
	 * output.
	 */
	description?: string;
	/**
	 * If true, null values will pass validation without running validation or
	 * sanitization steps.
	 * @default false
	 */
	isNullable?: boolean;
	/**
	 * If true, undefined values will pass validation without running validation
	 * or sanitization steps.
	 * @default false
	 */
	isUndefinable?: boolean;
	/**
	 * If true, both null and undefined values will pass validation without
	 * running validation or sanitization steps. Explicit isNullable and
	 * isUndefinable values take precedence for their respective inputs.
	 * @default false
	 */
	isOptional?: boolean;
}

export interface RunsLikeAValSan<TInput = unknown, TOutput = TInput> {
	readonly type: ValSanTypes;
	readonly format?: string;
	readonly example: string;
	readonly getTitle: () => string;
	readonly getDescription: () => string | undefined;
	readonly getValidationDescription?: () => string | undefined;
	readonly getRuleHelperTexts?: () => string[];
	readonly options: ValSanOptions;

	rules(): RuleSet;
	run(input: TInput): Promise<SanitizeResult<TOutput>>;
}

export abstract class ValSan<
		TInput = unknown,
		TOutput = TInput,
		TNormalized = TInput | TOutput,
	>
	extends BaseValSan<TInput, TOutput>
	implements RunsLikeAValSan<TInput, TOutput> {
	public constructor(public override readonly options: ValSanOptions = {}) {
		super();
	}

	public rules(): RuleSet {
		return {};
	}

	public getValidationDescription(): string | undefined {
		return this.buildValidationDescription(this.getRuleHelperTexts());
	}

	public getRuleHelperTexts(): string[] {
		return this.collectRuleHelperTexts(this.rules());
	}

	public copy(options: ValSanOptions): ValSan<TInput, TOutput, TNormalized> {
		const constructor = this.constructor as new (
			options: ValSanOptions
		) => ValSan<TInput, TOutput, TNormalized>;

		return new constructor({ ...this.options, ...options });
	}

	/**
	 * Optional normalization step applied before validation.
	 */
	protected async normalize(input: TInput): Promise<TNormalized> {
		return input as unknown as TNormalized;
	}

	protected abstract validate(input: TNormalized): Promise<ValidationResult>;
	protected abstract sanitize(input: TNormalized): Promise<TOutput>;

	public async run(
		input: TInput | null | undefined
	): Promise<SanitizeResult<TOutput>> {
		// Handle optional fields
		if (input === undefined || input === null) {
			return this.checkRequired(input);
		}

		// Apply normalization before validation
		const normalized = await this.normalize(input);
		const validation = await this.validate(normalized);

		if (!validation.isValid) {
			return {
				success: false,
				errors: validation.errors,
			};
		}

		try {
			const data = await this.sanitize(normalized);
			return {
				success: true,
				data,
				errors: [],
			};
		}
		catch (error) {
			const message =
				error instanceof Error ? error.message : 'Sanitization failed';
			return {
				success: false,
				errors: [
					{
						code: 'SANITIZE_ERROR',
						message,
					},
				],
			};
		}
	}

	public async fail(rules: Rule[]): Promise<ValidationResult> {
		return validationError(
			rules.map((rule) => ({
				code: rule.code,
				message: rule.user.errorMessage,
				context: rule.context,
			}))
		);
	}

	public async pass(): Promise<ValidationResult> {
		return {
			isValid: true,
			errors: [],
		};
	}

	protected validationError(
		error: ValidationError,
		segment: string | number
	): ValidationError {
		const prefix = typeof segment === 'number' ? `[${segment}]` : segment;

		return {
			...error,
			field: error.field ? `${prefix}.${error.field}` : prefix,
			path: [segment, ...(error.path ?? [])],
		};
	}
}
