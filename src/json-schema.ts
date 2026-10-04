import type { StandardJSONSchemaV1 } from '@standard-schema/spec';
import type { SchemaLike } from './schema';
import type { Rule, RuleSet, RuleJsonSchema } from './rules/rule';
import type { ValSanValueType } from './types/types';

export type JsonSchema = Record<string, unknown>;
export type JsonSchemaDirection = 'input' | 'output';
export type JsonSchemaOptions = StandardJSONSchemaV1.Options;
export interface JsonSchemaDefinition {
	input: JsonSchema;
	output: JsonSchema;
}

export interface JsonSchemaShapes {
	input: ValSanValueType;
	output: ValSanValueType;
}

function primitiveTypes(type: ValSanValueType): Array<
	'string' | 'number' | 'integer' | 'boolean'
> {
	const types = typeof type === 'string' ? [type] : [...type];
	if (types.length === 0) {
		throw new TypeError('JSON Schema type unions cannot be empty');
	}
	return [...new Set(types)].map((value) => {
		switch (value) {
		case 'string':
		case 'number':
		case 'integer':
		case 'boolean':
			return value;
		default:
			throw new TypeError(
				`Cannot derive primitive JSON Schema for ${value}; ` +
				'provide explicit definitions or a conversion hook'
			);
		}
	});
}

function ruleConstraints(rule: Rule): Partial<RuleJsonSchema> {
	if (rule.jsonSchema === 'type-only') {
		return {};
	}

	if (rule.jsonSchema !== undefined) {
		if (Object.keys(rule.jsonSchema).length === 0) {
			throw new TypeError(
				`Rule ${rule.code} has empty JSON Schema ` +
				'constraint metadata; use a recognized kind or ' +
				'jsonSchema: \'type-only\''
			);
		}
		return rule.jsonSchema;
	}

	const kind = rule.kind;

	switch (kind) {
	case 'type.number':
	case 'type.string':
	case 'type.integer':
	case 'type.boolean':
		return {};
	case 'number.minimum':
		return { minimum: rule.context?.min };
	case 'number.maximum':
		return { maximum: rule.context?.max };
	case 'number.range':
		return { minimum: rule.context?.min, maximum: rule.context?.max };
	case 'string.minLength':
		return { minLength: rule.context?.minLength };
	case 'string.maxLength':
		return { maxLength: rule.context?.maxLength };
	case undefined:
		throw new TypeError(
			`Rule ${rule.code} has no JSON Schema constraint metadata`
		);
	default:
		throw new TypeError(`Unsupported rule constraint kind: ${kind}`);
	}
}

export function deriveRuleSchema(
	shapes: JsonSchemaShapes,
	rules: RuleSet,
	direction: JsonSchemaDirection
): JsonSchema {
	const inputs = primitiveTypes(shapes.input);
	const outputs = primitiveTypes(shapes.output);
	const constraints: Partial<RuleJsonSchema> = {};
	for (const rule of Object.values(rules)) {
		for (const [keyword, value] of Object.entries(ruleConstraints(rule))) {
			if (
				keyword === 'minimum' || keyword === 'maximum'
			) {
				if (
					!outputs.every((type) =>
						type === 'number' || type === 'integer') ||
					!Number.isFinite(value)
				) {
					throw new TypeError(
						`JSON Schema ${keyword} requires a finite numeric bound`
					);
				}
				if (keyword === 'minimum') {
					constraints.minimum = Math.max(
						constraints.minimum ?? -Infinity, value
					);
				}
				else {
					constraints.maximum = Math.min(
						constraints.maximum ?? Infinity, value
					);
				}
			}
			else if (keyword === 'minLength' || keyword === 'maxLength') {
				if (keyword === 'maxLength' && value === Infinity) {
					continue;
				}
				if (
					!outputs.every((type) => type === 'string') ||
					!Number.isInteger(value) || value < 0
				) {
					throw new TypeError(
						`JSON Schema ${keyword} must be a nonnegative integer`
					);
				}
				if (keyword === 'minLength') {
					constraints.minLength = Math.max(
						constraints.minLength ?? 0, value
					);
				}
				else {
					constraints.maxLength = Math.min(
						constraints.maxLength ?? Infinity, value
					);
				}
			}
			else {
				throw new TypeError(
					`Unsupported JSON Schema constraint: ${keyword}`
				);
			}
		}
	}
	if (
		constraints.minimum !== undefined &&
		constraints.maximum !== undefined &&
		constraints.minimum > constraints.maximum
	) {
		throw new TypeError('JSON Schema range requires ordered finite bounds');
	}
	const branches = (schemas: JsonSchema[]): JsonSchema =>
		schemas.length === 1 ? schemas[0] : { anyOf: schemas };
	const output = branches(outputs.map((type) => ({ type, ...constraints })));
	if (direction === 'output') {
		return output;
	}
	return branches(inputs.map((type) => {
		if (
			type === 'number' && outputs.length === 1 &&
			outputs[0] === 'integer'
		) {
			return { type: 'integer', ...constraints };
		}
		return outputs.includes(type) ? { type, ...constraints } : { type };
	}));
}

export function assertJsonSchemaTarget(options: JsonSchemaOptions): void {
	if (
		options.target !== 'draft-2020-12' &&
		options.target !== 'draft-07'
	) {
		throw new TypeError(
			`Unsupported JSON Schema target: ${options.target}`
		);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertInlineSchema(
	value: unknown,
	ancestors = new Set<object>()
): void {
	if (typeof value !== 'object' || value === null) {
		return;
	}
	if (ancestors.has(value)) {
		throw new TypeError('Cyclic JSON Schema conversion result');
	}
	if (
		isRecord(value) &&
		('$ref' in value || '$dynamicRef' in value || '$id' in value)
	) {
		throw new TypeError(
			'Reference-bearing child schemas require explicit parent ' +
			'options.jsonSchema'
		);
	}
	ancestors.add(value);
	if (Array.isArray(value)) {
		for (const nested of value) {
			assertInlineSchema(nested, ancestors);
		}
	}
	else if (isRecord(value)) {
		for (const keyword of [
			'allOf', 'anyOf', 'oneOf', 'prefixItems', 'items', 'contains',
			'additionalProperties', 'unevaluatedProperties', 'unevaluatedItems',
			'not', 'if', 'then', 'else', 'propertyNames', 'additionalItems',
		]) {
			assertInlineSchema(value[keyword], ancestors);
		}
		for (const keyword of [
			'properties', 'patternProperties', '$defs', 'definitions',
			'dependentSchemas', 'dependencies',
		]) {
			const nested = value[keyword];
			if (isRecord(nested)) {
				for (const child of Object.values(nested)) {
					assertInlineSchema(child, ancestors);
				}
			}
		}
	}
	ancestors.delete(value);
}

export function exportChildSchema(
	schema: SchemaLike,
	direction: JsonSchemaDirection,
	options: JsonSchemaOptions
): JsonSchema {
	if ('~standard' in schema) {
		const props: unknown = schema['~standard'];
		const converters = isRecord(props) ? props['jsonSchema'] : undefined;
		const converter = isRecord(converters)
			? converters[direction]
			: undefined;
		if (typeof converter === 'function') {
			const result: unknown = converter.call(converters, options);
			if (isRecord(result)) {
				assertInlineSchema(result);
				return result;
			}
			throw new TypeError(
				'Invalid Standard JSON Schema conversion result'
			);
		}
	}

	throw new TypeError('Child schema does not support Standard JSON Schema');
}
