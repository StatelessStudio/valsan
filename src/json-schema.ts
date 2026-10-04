import type { StandardJSONSchemaV1 } from '@standard-schema/spec';
import type { SchemaLike } from './schema';
import type { Rule, RuleSet, RuleJsonSchema } from './rules/rule';
import type { ValSanValueType } from './types/types';
import { MAX_EMAIL_LENGTH } from './primitives/person/email-limits';

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

function jsonEnum(value: unknown): Array<string | number | boolean> {
	if (
		!Array.isArray(value) || value.length === 0 ||
		!value.every((item) =>
			typeof item === 'string' || typeof item === 'boolean' ||
			(typeof item === 'number' && Number.isFinite(item))
		)
	) {
		throw new TypeError(
			'JSON Schema enums require nonempty JSON primitive values'
		);
	}

	return [...new Set<string | number | boolean>(value)];
}

function ruleConstraints(rule: Rule): JsonSchema {
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
		return { ...rule.jsonSchema };
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
	case 'string.pattern':
		if (!(rule.context?.regex instanceof RegExp)) {
			throw new TypeError('Pattern rules require a RegExp');
		}

		if (rule.context.regex.flags !== '') {
			throw new TypeError(
				'Regex flags cannot be represented in JSON Schema; ' +
				'provide options.jsonSchema'
			);
		}

		return { pattern: rule.context.regex.source };
	case 'value.enum':
		return { enum: jsonEnum(rule.context?.allowedValues) };
	case 'string.email':
		if (rule.context?.allowPlusAddress !== true) {
			throw new TypeError(
				'Restricted email validators require options.jsonSchema'
			);
		}

		return { format: 'email', maxLength: MAX_EMAIL_LENGTH };
	case 'string.emailDomains':
		if (
			rule.context === undefined ||
			rule.context.allowedDomains !== undefined
		) {
			throw new TypeError(
				'Restricted email validators require options.jsonSchema'
			);
		}

		return {};
	case undefined:
		throw new TypeError(
			`Rule ${rule.code} has no JSON Schema constraint metadata`
		);
	default:
		throw new TypeError(`Unsupported rule constraint kind: ${kind}`);
	}
}

function deriveConstraints(
	shapes: JsonSchemaShapes,
	metadata: JsonSchema[],
	direction: JsonSchemaDirection
): JsonSchema {
	const inputs = shapes.input === 'unknown' ? ['unknown'] :
		primitiveTypes(shapes.input);
	const outputs = shapes.output === 'unknown' ? ['unknown'] :
		primitiveTypes(shapes.output);
	const constraints: Partial<RuleJsonSchema> = {};
	const patterns = new Set<string>();
	for (const constraintsOfRule of metadata) {
		for (const [keyword, value] of Object.entries(constraintsOfRule)) {
			if (
				keyword === 'minimum' || keyword === 'maximum'
			) {
				if (
					!outputs.every((type) =>
						type === 'number' || type === 'integer') ||
					typeof value !== 'number' || !Number.isFinite(value)
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
					typeof value !== 'number' ||
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
			else if (keyword === 'pattern' || keyword === 'format') {
				if (
					!outputs.every((type) => type === 'string') ||
					typeof value !== 'string' ||
					(keyword === 'format' && value !== 'email')
				) {
					throw new TypeError(
						`JSON Schema ${keyword} requires string metadata`
					);
				}
				if (keyword === 'pattern') {
					patterns.add(value);
				}
				else {
					constraints.format = 'email';
				}
			}
			else if (keyword === 'enum') {
				const values = jsonEnum(value);
				constraints.enum = constraints.enum === undefined ? values :
					constraints.enum.filter((item) => values.includes(item));
				if (constraints.enum.length === 0) {
					throw new TypeError(
						'JSON Schema enum intersection is empty'
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
		(outputs.includes('unknown') || inputs.includes('unknown')) &&
		constraints.enum === undefined
	) {
		throw new TypeError(
			'Cannot derive primitive JSON Schema for unknown without an enum'
		);
	}

	const patternSchema: JsonSchema = patterns.size > 1
		? { allOf: [...patterns].map((pattern) => ({ pattern })) }
		: patterns.size === 1 ? { pattern: [...patterns][0] } : {};

	if (
		constraints.minimum !== undefined &&
		constraints.maximum !== undefined &&
		constraints.minimum > constraints.maximum
	) {
		throw new TypeError('JSON Schema range requires ordered finite bounds');
	}

	if (
		constraints.minLength !== undefined &&
		constraints.maxLength !== undefined &&
		constraints.minLength > constraints.maxLength
	) {
		throw new TypeError('JSON Schema length requires ordered bounds');
	}

	const branches = (schemas: JsonSchema[]): JsonSchema =>
		schemas.length === 1 ? schemas[0] : { anyOf: schemas };
	const shape = (type: string): JsonSchema =>
		type === 'unknown' ? {} : { type };
	const output = branches(outputs.map((type) => ({
		...shape(type), ...constraints, ...patternSchema,
	})));

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
		return outputs.includes(type)
			? { ...shape(type), ...constraints, ...patternSchema }
			: shape(type);
	}));
}

export function deriveRuleSchema(
	shapes: JsonSchemaShapes,
	rules: RuleSet,
	direction: JsonSchemaDirection
): JsonSchema {
	return deriveConstraints(
		shapes, Object.values(rules).map(ruleConstraints), direction
	);
}

export function intersectPrimitiveSchemas(schemas: JsonSchema[]): JsonSchema {
	const supported = new Set([
		'type', 'minimum', 'maximum', 'minLength', 'maxLength',
		'pattern', 'format', 'enum', 'title', 'description',
	]);
	const type = schemas[0]?.['type'];

	if (
		schemas.length === 0 ||
		(type !== 'string' && type !== 'number' &&
			type !== 'integer' && type !== 'boolean') ||
		!schemas.every((schema) =>
			schema['type'] === type &&
			(schema['format'] === undefined || schema['format'] === 'email') &&
			Object.keys(schema).every((key) => supported.has(key))
		)
	) {
		return { allOf: schemas };
	}

	const metadata = schemas.map((schema) =>
		Object.fromEntries(Object.entries(schema).filter(
			([key]) => key !== 'type' && key !== 'title' &&
				key !== 'description'
		))
	);

	return deriveConstraints({
		input: type, output: type,
	}, metadata, 'output');
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
