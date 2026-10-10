import {
	ValSan,
	ValSanOptions,
	SanitizeResult,
	ValidationError,
} from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { runSchema } from '../../schema';
import type {
	SchemaLike,
	SchemaInput,
	SchemaOutput,
	SchemaValue,
} from '../../schema';
import type {
	JsonSchema,
	JsonSchemaContext,
	JsonSchemaDirection,
	JsonSchemaOptions,
} from '../../json-schema';

export type ObjectSchema = Record<string, SchemaLike>;

type OptionalKeys<
	TSchema extends ObjectSchema,
	Direction extends 'input' | 'output',
> = {
	[Key in keyof TSchema]: undefined extends (
		Direction extends 'input'
			? SchemaInput<TSchema[Key]>
			: SchemaOutput<TSchema[Key]>
	)
		? Key
		: never;
}[keyof TSchema];

type ObjectValue<
	TSchema extends ObjectSchema,
	Direction extends 'input' | 'output',
> = {
	[Key in Exclude<
		keyof TSchema,
		OptionalKeys<TSchema, Direction>
	>]: Direction extends 'input'
		? SchemaInput<TSchema[Key]>
		: SchemaOutput<TSchema[Key]>;
} & {
	[Key in OptionalKeys<TSchema, Direction>]?: Direction extends 'input'
		? SchemaInput<TSchema[Key]>
		: SchemaOutput<TSchema[Key]>;
};

export type ObjectSchemaInput<TSchema extends ObjectSchema> = ObjectValue<
	TSchema,
	'input'
>;
export type ObjectSchemaOutput<TSchema extends ObjectSchema> = ObjectValue<
	TSchema,
	'output'
>;

export interface ObjectValSanOptions extends ValSanOptions {
	/**
	 * Schema defining the structure of the nested object.
	 */
	schema: ObjectSchema;

	/**
	 * Allow additional properties not defined in the schema.
	 * @default false
	 */
	allowAdditionalProperties?: boolean;
}

type Output<TOptions extends ObjectValSanOptions> = ObjectSchemaOutput<
	TOptions['schema']
> &
	(true extends TOptions['allowAdditionalProperties']
		? Record<string, unknown>
		: unknown);

type Input<TOptions extends ObjectValSanOptions> = ObjectSchemaInput<
	TOptions['schema']
> &
	(true extends TOptions['allowAdditionalProperties']
		? Record<string, unknown>
		: unknown);

/**
 * Validates and sanitizes nested objects.
 *
 * @example
 * ```typescript
 * const addressSchema = new ObjectValSan({
 *   schema: {
 *     street: new TrimSanitizer(),
 *     city: new TrimSanitizer(),
 *     zipCode: new PatternValidator({ pattern: /^\d{5}$/ })
 *   }
 * });
 *
 * const userSchema = new ObjectValSan({
 *   schema: {
 *     name: new TrimSanitizer(),
 *     email: new EmailValidator(),
 *     address: addressSchema // Nested object
 *   }
 * });
 * ```
 */
export class ObjectValSan<
	const TOptions extends ObjectValSanOptions = ObjectValSanOptions,
> extends ValSan<
	SchemaValue<Input<TOptions>, TOptions>,
	SchemaValue<Output<TOptions>, TOptions>,
	SchemaValue<Output<TOptions>, TOptions>,
	TOptions
> {
	override type: ValSanTypes = 'object';
	override title = 'Object';
	override description =
		'An object whose configured properties each satisfy their schema.';

	protected override jsonSchemaDefinition(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_direction: JsonSchemaDirection,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_options: JsonSchemaOptions,
		context: JsonSchemaContext
	): JsonSchema {
		const properties: Record<string, JsonSchema> = {};
		const required: string[] = [];

		for (const [key, child] of Object.entries(this.schema)) {
			Object.defineProperty(properties, key, {
				value: context.exportChild(child),
				enumerable: true,
				configurable: true,
				writable: true,
			});

			if (
				!('jsonSchemaAllowsUndefined' in child) ||
				child.jsonSchemaAllowsUndefined !== true
			) {
				required.push(key);
			}
		}

		return {
			type: 'object',
			properties,
			required,
			additionalProperties:
				this.options.allowAdditionalProperties ?? false,
		};
	}

	public get schema(): TOptions['schema'] {
		return this.options.schema;
	}

	constructor(options: TOptions) {
		super(options);
	}

	public override rules() {
		return {
			object: {
				code: 'object',
				user: {
					helperText: 'Must be a valid object',
					errorMessage: 'Value must be a valid object',
				},
			},
		};
	}

	public override async run(
		input: Record<string, unknown> | null | undefined
	): Promise<SanitizeResult<SchemaValue<Output<TOptions>, TOptions>>> {
		const options = this.options as ObjectValSanOptions;
		if (input === undefined || input === null) {
			return this.checkRequired(input);
		}

		if (
			typeof input !== 'object' ||
			input === null ||
			Array.isArray(input)
		) {
			return {
				success: false,
				errors: [
					{
						code: 'object',
						message: 'Value must be a valid object',
					},
				],
			};
		}

		const errors: ValidationError[] = [];
		const schema = options.schema;
		const output = Object.create(Object.getPrototypeOf(input)) as Record<
			string,
			unknown
		>;

		for (const key of Object.keys(input)) {
			Object.defineProperty(output, key, {
				configurable: true,
				enumerable: true,
				value: input[key],
				writable: true,
			});
		}

		for (const key of Object.keys(schema)) {
			const validator = schema[key];
			const value = input[key];
			const result = await runSchema(validator, value);

			if (result.success) {
				Object.defineProperty(output, key, {
					configurable: true,
					enumerable: true,
					value: result.data,
					writable: true,
				});
			}
			else {
				errors.push(
					...result.errors.map((err: ValidationError) =>
						this.validationError(err, key)
					)
				);
			}
		}

		if (!(this.options as ObjectValSanOptions).allowAdditionalProperties) {
			for (const key of Object.keys(output)) {
				if (!Object.hasOwn(schema, key)) {
					errors.push({
						field: key,
						path: [key],
						code: 'unexpected_field',
						message: 'Unexpected field',
					});
				}
			}
		}

		if (errors.length > 0) {
			return {
				success: false,
				errors,
			};
		}

		return {
			success: true,
			data: output as Output<TOptions>,
			errors: [],
		};
	}

	/**
	 * Unused - validation is handled in run()
	 */
	protected override async validate() {
		return this.pass();
	}

	/**
	 * Unused - sanitization is handled in run()
	 */
	protected override async sanitize() {
		return {} as Output<TOptions>;
	}
}
