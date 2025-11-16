import { validationError } from './errors';
import { Rule } from './rules';
import { RuleSet } from './rules/rule';
import { ValSanTypes } from './types/types';

export interface ValidationError {
	field?: string;
	code: string;
	message: string;
	context?: Record<string, unknown>;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export interface SanitizeResult<T> {
	success: boolean;
	data?: T;
	errors: ValidationError[];
}

export interface ValSanOptions {
	/**
	 * If true, undefined and null values will pass validation without
	 * running validation or sanitization steps.
	 * @default false
	 */
	isOptional?: boolean;
}

export interface RunsLikeAValSan<TInput = unknown, TOutput = TInput> {
	readonly type: ValSanTypes;
	readonly format?: string;
	readonly example: string;
	readonly options: ValSanOptions;

	rules(): RuleSet;
	run(input: TInput): Promise<SanitizeResult<TOutput>>;
}

export abstract class ValSan<
	TInput = unknown,
	TOutput = TInput,
	TNormalized = TInput | TOutput,
> implements RunsLikeAValSan<TInput, TOutput> {
	public constructor(public readonly options: ValSanOptions = {}) {}

	public type: ValSanTypes = 'unknown';
	public example = '';
	public format?: string;

	public rules(): RuleSet {
		return {};
	}

	/**
	 * Optional normalization step applied before validation.
	 */
	protected async normalize(input: TInput): Promise<TNormalized> {
		return input as unknown as TNormalized;
	}

	protected abstract validate(input: TNormalized): Promise<ValidationResult>;
	protected abstract sanitize(input: TNormalized): Promise<TOutput>;

	public async run(input: TInput): Promise<SanitizeResult<TOutput>> {
		// Handle optional fields
		const isOptional = this.options.isOptional;
		if (input === undefined || input === null) {
			if (isOptional) {
				return {
					success: true,
					data: input as unknown as TOutput,
					errors: [],
				};
			}
			else {
				return {
					success: false,
					errors: [
						{
							code: 'required',
							message: 'Value is required',
						},
					],
				};
			}
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
}
