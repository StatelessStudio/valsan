import { ValSanTypes, ValSanValueType } from './types/types';
import { RuleSet } from './rules/rule';
import { SanitizeResult, ValSanOptions } from './valsan';
import {
	assertJsonSchemaTarget,
	JsonSchema,
	JsonSchemaDirection,
	JsonSchemaOptions,
} from './json-schema';

export class BaseValSan<TInput = unknown, TOutput = TInput> {
	private exportingJsonSchema = false;

	public get jsonSchemaPreservesInput(): boolean {
		return false;
	}

	public get jsonSchemaAllowsUndefined(): boolean {
		return this.allowsUndefined;
	}

	protected get jsonSchemaAllowsNull(): boolean {
		return this.allowsNull;
	}

	private get allowsNull(): boolean {
		return this.options.isNullable ?? this.options.isOptional ?? false;
	}

	private get allowsUndefined(): boolean {
		return this.options.isUndefinable ?? this.options.isOptional ?? false;
	}

	public toJsonSchema(
		direction: JsonSchemaDirection,
		options: JsonSchemaOptions
	): JsonSchema {
		assertJsonSchemaTarget(options);
		if (this.exportingJsonSchema) {
			throw new TypeError(
				'Cyclic schemas cannot be exported to JSON Schema'
			);
		}

		this.exportingJsonSchema = true;
		try {
			const schema = this.options.jsonSchema?.[direction] ??
				this.jsonSchemaDefinition(direction, options);
			const exported: JsonSchema = this.jsonSchemaAllowsNull
				? { anyOf: [structuredClone(schema), { type: 'null' }] }
				: structuredClone(schema);
			exported['title'] = schema['title'] ?? this.getTitle();
			const description = schema['description'] ?? this.getDescription();
			if (description !== undefined) {
				exported['description'] = description;
			}

			return exported;
		}
		finally {
			this.exportingJsonSchema = false;
		}
	}

	protected jsonSchemaDefinition(
		direction: JsonSchemaDirection,
		options: JsonSchemaOptions
	): JsonSchema {
		throw new TypeError(
			`${this.constructor.name} does not support JSON Schema export; ` +
			'provide options.jsonSchema or override jsonSchemaDefinition() ' +
			`for ${direction} (${options.target})`
		);
	}

	public type: ValSanTypes = 'unknown';
	public inputType?: ValSanValueType;
	public outputType?: ValSanValueType;

	protected title: string | undefined = undefined;
	protected description: string | undefined = undefined;
	public example = '';
	public format?: string;

	public options: ValSanOptions;

	public getTitle(): string {
		return this.options?.title ?? this.title ?? this.constructor.name;
	}

	public getDescription(): string | undefined {
		return this.options?.description ?? this.description ?? undefined;
	}

	protected buildValidationDescription(
		supplementalDescriptions: readonly (string | undefined)[]
	): string | undefined {
		const descriptions = [
			this.getDescription(),
			...supplementalDescriptions,
		]
			.map((description) => description?.trim())
			.filter(
				(description): description is string => Boolean(description)
			);
		const uniqueDescriptions = [...new Set(descriptions)];

		return uniqueDescriptions.length > 0
			? uniqueDescriptions.join('\n')
			: undefined;
	}

	protected collectRuleHelperTexts(rules: RuleSet): string[] {
		const ignoreRuleKeys = new Set([
			'string'
		]);

		return Object.entries(rules).flatMap(([key, rule]) => {
			if (ignoreRuleKeys.has(key)) {
				return [];
			}

			return [rule.user.helperText, rule.dev?.helperText].filter(
				(helperText): helperText is string => Boolean(helperText)
			);
		});
	}

	public checkRequired(input: unknown): SanitizeResult<TOutput> {
		let isAllowed = this.options.isOptional ?? false;

		if (input === null) {
			isAllowed = this.allowsNull;
		}
		else if (input === undefined) {
			isAllowed = this.allowsUndefined;
		}

		if (isAllowed) {
			return {
				success: true,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				data: input as any,
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
}
