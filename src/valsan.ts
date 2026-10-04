import { validationError } from './errors';
import { Rule } from './rules';
import { RuleSet } from './rules/rule';
import { ValSanTypes, ValSanValueType } from './types/types';
import { BaseValSan } from './valsan-base';
import { standardProps, SchemaValue } from './schema';
import {
	deriveRuleSchema,
	JsonSchema,
	JsonSchemaDefinition,
	JsonSchemaDirection,
	JsonSchemaOptions,
	JsonSchemaShapes,
} from './json-schema';

export interface ValidationError {
	field?: string;
	/**
	 * Path to the invalid value, using property keys and array indices as
	 * separate segments
	 */
	path?: PropertyKey[];
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
	 * Explicit JSON representations for custom validators or transformations.
	 */
	jsonSchema?: JsonSchemaDefinition;
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
	readonly inputType?: ValSanValueType;
	readonly outputType?: ValSanValueType;
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
		TOptions extends ValSanOptions = ValSanOptions,
	>
	extends BaseValSan<TInput, TOutput>
	implements RunsLikeAValSan<TInput, TOutput> {
	public readonly '~standard' = standardProps<
		ValSanOptions extends NoInfer<TOptions> ? TInput :
			SchemaValue<TInput, NoInfer<TOptions>>,
		SchemaValue<TOutput, NoInfer<TOptions>>
	>(
		async (input) => this.run(input as TInput),
		{
			input: (options) => this.toJsonSchema('input', options),
			output: (options) => this.toJsonSchema('output', options),
		}
	);

	public override readonly options: NoInfer<TOptions> &
		Readonly<ValSanOptions>;

	public constructor(options: TOptions = {} as TOptions) {
		super();
		this.options = options;
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

	protected override jsonSchemaDefinition(
		direction: JsonSchemaDirection,
		options: JsonSchemaOptions
	): JsonSchema {
		const rules = this.rules();
		if (Object.keys(rules).length === 0) {
			return super.jsonSchemaDefinition(direction, options);
		}
		const shapes: JsonSchemaShapes = {
			input: this.inputType ?? this.type,
			output: this.outputType ?? this.type,
		};
		return deriveRuleSchema(shapes, rules, direction);
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
		segment: PropertyKey
	): ValidationError {
		const prefix =
			typeof segment === 'number' ? `[${segment}]` : String(segment);

		return {
			...error,
			field: error.field ? `${prefix}.${error.field}` : prefix,
			path: [segment, ...(error.path ?? [])],
		};
	}
}
