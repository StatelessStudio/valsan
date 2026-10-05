import type {
	StandardSchemaV1,
	StandardJSONSchemaV1,
} from '@standard-schema/spec';
import type {
	RunsLikeAValSan,
	SanitizeResult,
	ValidationError,
	ValSanOptions,
} from './valsan';

type OptionValue<
	TOptions,
	Key extends PropertyKey
> = Key extends keyof TOptions ? TOptions[Key] : undefined;

type AllowsNullish<TOptions, Key extends PropertyKey> =
	Extract<OptionValue<TOptions, Key>, boolean> |
	(undefined extends OptionValue<TOptions, Key>
		? OptionValue<TOptions, 'isOptional'>
		: never);

export type SchemaValue<TValue, TOptions extends ValSanOptions> =
	TValue | (TOptions extends unknown ?
		(true extends AllowsNullish<TOptions, 'isNullable'> ? null : never) |
		(true extends AllowsNullish<TOptions, 'isUndefinable'>
			? undefined : never)
		: never);

export type SchemaInput<TSchema> =
	TSchema extends StandardSchemaV1<infer TInput, unknown> ? TInput :
	TSchema extends RunsLikeAValSan<infer TInput, unknown>
		? SchemaValue<TInput, TSchema['options']> : never;

export type SchemaOutput<TSchema> =
	TSchema extends StandardSchemaV1<unknown, infer TOutput> ? TOutput :
	TSchema extends RunsLikeAValSan<unknown, infer TOutput>
		? SchemaValue<TOutput, TSchema['options']> : never;

export type StandardSchema = StandardSchemaV1<unknown, unknown>;

export type SchemaLike = RunsLikeAValSan<unknown, unknown> | StandardSchema;

export function standardProps<TInput, TOutput>(
	run: (input: unknown) => Promise<SanitizeResult<TOutput>>,
	jsonSchema: StandardJSONSchemaV1.Converter
): StandardSchemaV1.Props<TInput, TOutput> &
	StandardJSONSchemaV1.Props<TInput, TOutput> {
	return {
		version: 1,
		vendor: 'valsan',
		jsonSchema,
		validate: async (input) => {
			const result = await run(input);

			if (result.success) {
				return { value: result.data };
			}

			return {
				issues: result.errors.map((error) => ({
					message: error.message,
					...(error.path === undefined ? {} : { path: error.path }),
				})),
			};
		},
	};
}

function isObject(value: unknown): value is object {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSchemaContainer(value: unknown): value is object {
	return isObject(value) || typeof value === 'function';
}

function isPropertyKey(value: unknown): value is PropertyKey {
	return typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'symbol';
}

function normalizePathSegment(
	segment: unknown
): PropertyKey {
	if (isPropertyKey(segment)) {
		return segment;
	}

	if (
		isObject(segment) &&
		'key' in segment &&
		isPropertyKey(segment.key)
	) {
		return segment.key;
	}

	throw new TypeError('Invalid Standard Schema validation result');
}

function validationIssue(issue: unknown): ValidationError {
	if (
		!isObject(issue) ||
		!('message' in issue) ||
		typeof issue.message !== 'string'
	) {
		throw new TypeError('Invalid Standard Schema validation result');
	}

	if (!('path' in issue) || issue.path === undefined) {
		return { code: 'standard_schema', message: issue.message };
	}

	if (!Array.isArray(issue.path)) {
		throw new TypeError('Invalid Standard Schema validation result');
	}

	return {
		code: 'standard_schema',
		message: issue.message,
		path: Array.from(issue.path, normalizePathSegment),
	};
}

export async function runSchema(
	schema: SchemaLike,
	input: unknown
): Promise<SanitizeResult<unknown>> {
	if (!isSchemaContainer(schema)) {
		throw new TypeError(
			'Schema must implement run() or Standard Schema v1 validation'
		);
	}

	if ('run' in schema && typeof schema.run === 'function') {
		return schema.run(input);
	}

	if (
		'~standard' in schema &&
		isSchemaContainer(schema['~standard']) &&
		schema['~standard'].version === 1 &&
		typeof schema['~standard'].vendor === 'string' &&
		typeof schema['~standard'].validate === 'function'
	) {
		const result = await schema['~standard'].validate(input);

		if (!isObject(result)) {
			throw new TypeError('Invalid Standard Schema validation result');
		}

		if (result.issues !== undefined) {
			if (!Array.isArray(result.issues)) {
				throw new TypeError(
					'Invalid Standard Schema validation result'
				);
			}

			if (result.issues.length === 0) {
				return {
					success: false,
					errors: [
						{
							code: 'standard_schema',
							message:
								'Standard Schema failed without issues',
						},
					],
				};
			}

			return {
				success: false,
				errors: Array.from(result.issues, validationIssue),
			};
		}

		if (!('value' in result)) {
			throw new TypeError('Invalid Standard Schema validation result');
		}

		return {
			success: true,
			data: result.value,
			errors: [],
		};
	}

	throw new TypeError(
		'Schema must implement run() or Standard Schema v1 validation'
	);
}
