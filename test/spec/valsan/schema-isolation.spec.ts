import 'jasmine';
import type {
	StandardSchemaV1,
	StandardJSONSchemaV1,
} from '@standard-schema/spec';
import {
	ArrayValSan,
	ComposedValSan,
	ObjectValSan,
	SchemaInput,
	SchemaOutput,
	TrimSanitizer,
	StringToNumberValSan,
	MinLengthValidator,
	MaxLengthValidator,
} from '../../../src';
import { runSchema } from '../../../src/schema';
import { toJsonSchema, withJsonSchema } from '../../../src/json-schema';
import type {
	JsonSchema,
	JsonSchemaContext,
	JsonSchemaDirection,
	JsonSchemaOptions,
	JsonSchemaProvider,
} from '../../../src/json-schema';

describe('Optional JSON Schema isolation', () => {
	it('creates stable validation-only adapters on first access', async () => {
		for (const schema of [
			new TrimSanitizer(),
			new ComposedValSan<string, string>([new TrimSanitizer()]),
		]) {
			expect(Object.hasOwn(schema, '~standard')).toBe(false);
			expect((await schema.run(' hi ')).data).toBe('hi');
			expect(Object.hasOwn(schema, '~standard')).toBe(false);
			const first = schema['~standard'];
			expect(Object.hasOwn(schema, '~standard')).toBe(true);
			expect(schema['~standard']).toBe(first);
			expect('jsonSchema' in first).toBe(false);
			expect(await first.validate(' hi ')).toEqual({ value: 'hi' });
		}
	});

	it('returns native validation promises without wrapping them', async () => {
		const schema = new TrimSanitizer();
		const result = Promise.resolve(await schema.run('hi'));
		const spy = spyOn(schema, 'run').and.returnValue(result);
		expect(runSchema(schema, 'hi')).toBe(result);
		expect(spy).toHaveBeenCalledWith('hi');
		expect(Object.hasOwn(schema, '~standard')).toBe(false);
	});

	it('keeps lazy adapters usable and stable on frozen schemas', async () => {
		for (const schema of [
			new TrimSanitizer(),
			new ComposedValSan<string, string>([new TrimSanitizer()]),
		]) {
			Object.freeze(schema);
			const props = schema['~standard'];
			expect(schema['~standard']).toBe(props);
			expect(await props.validate(' hi ')).toEqual({ value: 'hi' });
			const adapted = withJsonSchema(schema);
			expect(await adapted['~standard'].validate(' hi ')).toEqual({
				value: 'hi',
			});
		}
	});

	it('adapts typed validation and both JSON Schema directions', async () => {
		const schema = new ObjectValSan({
			schema: { count: new StringToNumberValSan() },
		});
		const adapted = withJsonSchema(schema);
		const standard: StandardSchemaV1<
			SchemaInput<typeof schema>,
			SchemaOutput<typeof schema>
		> &
			StandardJSONSchemaV1<
				SchemaInput<typeof schema>,
				SchemaOutput<typeof schema>
			> = adapted;
		const input: SchemaInput<typeof adapted> = { count: '42' };
		const output: SchemaOutput<typeof adapted> = { count: 42 };
		// @ts-expect-error The adapter retains the transformed input type.
		const wrongInput: SchemaInput<typeof adapted> = { count: 42 };
		// @ts-expect-error The adapter retains the transformed output type.
		const wrongOutput: SchemaOutput<typeof adapted> = { count: '42' };
		expect(wrongInput).toBeDefined();
		expect(wrongOutput).toBeDefined();
		expect(await standard['~standard'].validate(input)).toEqual({
			value: output,
		});
		for (const direction of ['input', 'output'] as const) {
			expect(
				standard['~standard'].jsonSchema[direction]({
					target: 'draft-07',
				})
			).toEqual(
				toJsonSchema(schema, direction, {
					target: 'draft-07',
				})
			);
		}
		expect('jsonSchema' in schema['~standard']).toBe(false);
		expect<object>(adapted).not.toBe(schema);
	});

	it('preserves issue paths and exceptions through the adapter', async () => {
		const schema = new ObjectValSan({
			schema: { count: new StringToNumberValSan() },
		});
		const adapted = withJsonSchema(schema);
		expect(
			await adapted['~standard'].validate({ count: 'invalid' })
		).toEqual(await schema['~standard'].validate({ count: 'invalid' }));
		const error = new Error('Validation failed');
		spyOn(schema, 'run').and.rejectWith(error);
		await expectAsync(
			adapted['~standard'].validate({ count: '42' })
		).toBeRejectedWith(error);
	});

	it('does not perform conversion until a converter is called', async () => {
		const schema = new ComposedValSan<string, number>([
			new TrimSanitizer(),
			new StringToNumberValSan(),
		]);
		const adapted = withJsonSchema(schema);
		expect(await adapted['~standard'].validate(' 42 ')).toEqual({
			value: 42,
		});
		expect(() =>
			adapted['~standard'].jsonSchema.input({
				target: 'draft-07',
			})
		).toThrowError(TypeError, /Transforming compositions/);
		expect((await schema.run(' 42 ')).data).toBe(42);
	});

	it('retains live native optionality for adapted children', () => {
		const childOptions = { isOptional: true };
		const child = new TrimSanitizer(childOptions);
		const adapted = withJsonSchema(child);
		const parent = new ObjectValSan({ schema: { name: adapted } });
		const options = { target: 'draft-07' };
		expect(toJsonSchema(parent, 'input', options)['required']).toEqual([]);
		expect(() =>
			toJsonSchema(new ArrayValSan({ schema: adapted }), 'input', {
				target: 'draft-07',
			})
		).toThrowError(TypeError, /Undefined array elements/);
		childOptions.isOptional = false;
		expect(toJsonSchema(parent, 'input', options)['required']).toEqual([
			'name',
		]);
	});

	it('preserves foreign receivers and vendor options', async () => {
		const props = {
			version: 1 as const,
			vendor: 'foreign',
			marker: 'validated',
			validate(input: unknown, options?: StandardSchemaV1.Options) {
				return {
					value:
						`${this.marker}:${input}:` +
						`${options?.libraryOptions?.['tag']}`,
				};
			},
			jsonSchema: {
				input: () => ({ type: 'string' }),
				output: () => ({ type: 'string' }),
			},
		};
		const adapted = withJsonSchema({ '~standard': props });
		const validate = adapted['~standard'].validate;
		expect(
			await validate('hi', { libraryOptions: { tag: 'test' } })
		).toEqual({ value: 'validated:hi:test' });
		expect(adapted['~standard'].vendor).toBe('foreign');
		expect(
			adapted['~standard'].jsonSchema.input({ target: 'draft-07' })
		).toEqual({ type: 'string' });
	});

	it('exports structural providers without native class inheritance', () => {
		const child = new StringToNumberValSan();
		const provider: StandardSchemaV1 & JsonSchemaProvider = {
			'~standard': child['~standard'],
			options: { isNullable: true },
			getTitle: () => 'Envelope',
			getDescription: () => 'A custom container.',
			getJsonSchemaDefinition(direction, options, context) {
				expect(this.options.isNullable).toBe(true);
				expect(options.libraryOptions).toEqual({ marker: 'test' });
				expect(['input', 'output']).toContain(direction);
				return {
					type: 'object',
					properties: { count: context.exportChild(child) },
					required: ['count'],
					additionalProperties: false,
				};
			},
		};
		const spy = spyOn(
			provider,
			'getJsonSchemaDefinition'
		).and.callThrough();
		for (const direction of ['input', 'output'] as const) {
			const options = {
				target: 'draft-2020-12',
				libraryOptions: { marker: 'test' },
			};
			const definition = {
				type: 'object',
				properties: { count: toJsonSchema(child, direction, options) },
				required: ['count'],
				additionalProperties: false,
			};
			const expected = {
				anyOf: [definition, { type: 'null' }],
				title: 'Envelope',
				description: 'A custom container.',
			};
			expect(toJsonSchema(provider, direction, options)).toEqual(
				expected
			);
			expect(
				withJsonSchema(provider)['~standard'].jsonSchema[direction](
					options
				)
			).toEqual(expected);
			const parent = new ArrayValSan({ schema: provider });
			expect(toJsonSchema(parent, direction, options)['items']).toEqual(
				expected
			);
		}
		expect(spy).toHaveBeenCalledTimes(6);
		provider.options.jsonSchema = {
			input: { type: 'boolean' },
			output: { type: 'number' },
		};
		expect(toJsonSchema(provider, 'input', { target: 'draft-07' })).toEqual(
			{
				anyOf: [{ type: 'boolean' }, { type: 'null' }],
				title: 'Envelope',
				description: 'A custom container.',
			}
		);
		expect(spy).toHaveBeenCalledTimes(6);
	});

	it('lets subclasses delegate to native hooks through the context', () => {
		class CustomArray extends ArrayValSan {
			protected override jsonSchemaDefinition(
				direction: JsonSchemaDirection,
				options: JsonSchemaOptions,
				context: JsonSchemaContext
			): JsonSchema {
				return {
					...super.jsonSchemaDefinition(direction, options, context),
					minItems: 2,
				};
			}
		}
		class CustomObject extends ObjectValSan {
			protected override jsonSchemaDefinition(
				direction: JsonSchemaDirection,
				options: JsonSchemaOptions,
				context: JsonSchemaContext
			): JsonSchema {
				return {
					...super.jsonSchemaDefinition(direction, options, context),
					minProperties: 1,
				};
			}
		}
		class CustomComposition extends ComposedValSan<string, string> {
			protected override jsonSchemaDefinition(
				direction: JsonSchemaDirection,
				options: JsonSchemaOptions,
				context: JsonSchemaContext
			): JsonSchema {
				return {
					...super.jsonSchemaDefinition(direction, options, context),
					pattern: '^a',
				};
			}
		}
		class CustomPrimitive extends MinLengthValidator {
			protected override jsonSchemaDefinition(
				direction: JsonSchemaDirection,
				options: JsonSchemaOptions,
				context: JsonSchemaContext
			): JsonSchema {
				return {
					...super.jsonSchemaDefinition(direction, options, context),
					pattern: 'z$',
				};
			}
		}
		const options = { target: 'draft-07' };
		const composition = new CustomComposition([
			new CustomPrimitive(),
			new MaxLengthValidator({ maxLength: 8 }),
		]);
		const array = new CustomArray({ schema: composition });
		const object = new CustomObject({ schema: { items: array } });
		for (const direction of ['input', 'output'] as const) {
			expect(toJsonSchema(composition, direction, options)).toEqual(
				jasmine.objectContaining({
					type: 'string',
					minLength: 1,
					maxLength: 8,
					pattern: '^a',
				})
			);
			expect(toJsonSchema(array, direction, options)).toEqual(
				jasmine.objectContaining({
					type: 'array',
					minItems: 2,
					items: toJsonSchema(composition, direction, options),
				})
			);
			expect(toJsonSchema(object, direction, options)).toEqual(
				jasmine.objectContaining({
					type: 'object',
					minProperties: 1,
					properties: {
						items: toJsonSchema(array, direction, options),
					},
				})
			);
		}
	});

	it('rejects invalid definitions and propagates hook errors', () => {
		const schema = new TrimSanitizer();
		const spy = spyOn(schema, 'getJsonSchemaDefinition');
		// @ts-expect-error Invalid implementations must fail at runtime too.
		spy.and.returnValue(undefined);
		expect(() =>
			toJsonSchema(schema, 'input', { target: 'draft-07' })
		).toThrowError(TypeError, /Invalid JSON Schema definition/);
		const error = new Error('Custom conversion failed');
		spy.and.throwError(error);
		expect(() =>
			toJsonSchema(schema, 'input', { target: 'draft-07' })
		).toThrow(error);
		spy.and.callThrough();
		expect(
			toJsonSchema(schema, 'input', { target: 'draft-07' })['type']
		).toBe('string');
	});
});
