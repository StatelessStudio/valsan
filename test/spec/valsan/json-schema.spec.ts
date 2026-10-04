import 'jasmine';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020';
import type {
	StandardJSONSchemaV1,
	StandardSchemaV1,
} from '@standard-schema/spec';
import {
	ArrayValSan,
	ComposedValSan,
	EmailValidator,
	EnumValidator,
	IntegerValidator,
	JsonSchema,
	JsonSchemaDirection,
	JsonSchemaOptions,
	JsonSchemaShapes,
	LengthValidator,
	LowercaseSanitizer,
	MaxLengthValidator,
	MaxValidator,
	MinLengthValidator,
	MinValidator,
	ObjectValSan,
	PatternValidator,
	RangeValidator,
	StringToBooleanValSan,
	StringToNumberValSan,
	TrimSanitizer,
	UppercaseSanitizer,
	ValSan,
	ValSanOptions,
	RuleSet,
	Rule,
	RuleConstraint,
	RunsLikeAValSan,
	ObjectSchema,
} from '../../../src';
import type { ValSanTypes } from '../../../src/types/types';
import {
	exportChildSchema,
	deriveRuleSchema,
	intersectPrimitiveSchemas,
} from '../../../src/json-schema';

describe('Standard JSON Schema export', () => {
	function documented(
		schema: Pick<RunsLikeAValSan, 'getTitle' | 'getDescription'>,
		definition: JsonSchema
	): JsonSchema {
		const description =
			definition['description'] ?? schema.getDescription();
		return {
			...definition,
			title: definition['title'] ?? schema.getTitle(),
			...(description === undefined ? {} : { description }),
		};
	}

	it('shares nullish policy across validation and export without caching',
		async () => {
			const options: ValSanOptions = {};
			const schema = new TrimSanitizer(options);
			for (const optional of [undefined, false, true]) {
				for (const nullable of [undefined, false, true]) {
					for (const undefinable of [undefined, false, true]) {
						options.isOptional = optional;
						options.isNullable = nullable;
						options.isUndefinable = undefinable;
						const allowsNull = nullable ?? optional ?? false;
						const allowsUndefined =
							undefinable ?? optional ?? false;
						expect((await schema.run(null)).success)
							.toBe(allowsNull);
						expect((await schema.run(undefined)).success)
							.toBe(allowsUndefined);
						expect(schema.jsonSchemaAllowsUndefined)
							.toBe(allowsUndefined);
						for (const direction of ['input', 'output'] as const) {
							const json = schema.toJsonSchema(direction, {
								target: 'draft-07',
							});
							expect(new Ajv().compile(json)(null))
								.toBe(allowsNull);
						}
					}
				}
			}
		});

	it('renders merged constraints consistently for rules and compositions',
		() => {
			const first = {
				minLength: 2, maxLength: 8, pattern: '^a',
				enum: ['abz', 'az'],
			};
			const second = {
				minLength: 3, maxLength: 6, pattern: 'z$',
				enum: ['abz', 'bz'],
			};
			const rule = (jsonSchema: Rule['jsonSchema']): Rule => ({
				code: 'constraint',
				user: { helperText: '', errorMessage: '' },
				jsonSchema,
			});
			const composed = intersectPrimitiveSchemas([
				{ type: 'string', ...first }, { type: 'string', ...second },
			]);
			for (const direction of ['input', 'output'] as const) {
				expect(deriveRuleSchema({
					input: 'string', output: 'string',
				}, {
					first: rule(first), second: rule(second),
				}, direction)).toEqual(composed);
			}
			expect(composed).toEqual({
				type: 'string', minLength: 3, maxLength: 6, enum: ['abz'],
				allOf: [{ pattern: '^a' }, { pattern: 'z$' }],
			});
			expect(Object.values(composed)).not.toContain(undefined);
		});

	it('exports default and custom documentation on both directions and drafts',
		() => {
			const defaults = new TrimSanitizer();
			const custom = new TrimSanitizer({
				title: 'Display name', description: 'A public display name.',
			});
			for (const target of ['draft-07', 'draft-2020-12']) {
				for (const direction of ['input', 'output'] as const) {
					expect(defaults.toJsonSchema(direction, { target }))
						.toEqual({
							type: 'string',
							title: defaults.getTitle(),
							description: defaults.getDescription(),
						});
					expect(custom.toJsonSchema(direction, { target }))
						.toEqual({
							type: 'string', title: 'Display name',
							description: 'A public display name.',
						});
				}
			}
		});

	it('documents nested containers and the outer nullable schema', () => {
		const child = new TrimSanitizer({
			title: 'Item', description: 'An item.',
		});
		const array = new ArrayValSan({
			schema: child, title: 'Items', description: 'A list of items.',
		});
		const parent = new ObjectValSan({
			schema: { items: array }, isNullable: true,
			title: 'Payload', description: 'A nullable payload.',
		});
		for (const direction of ['input', 'output'] as const) {
			const json = parent.toJsonSchema(direction, { target: 'draft-07' });
			expect(json).toEqual({
				title: 'Payload', description: 'A nullable payload.',
				anyOf: [
					{
						type: 'object', required: ['items'],
						additionalProperties: false,
						properties: {
							items: {
								type: 'array', title: 'Items',
								description: 'A list of items.',
								items: {
									type: 'string', title: 'Item',
									description: 'An item.',
								},
							},
						},
					},
					{ type: 'null' },
				],
			});
		}
	});

	it('documents compositions and preserves explicit annotation precedence',
		() => {
			const schema = new ComposedValSan([
				new MinLengthValidator({ minLength: 2 }),
				new MaxLengthValidator({ maxLength: 4 }),
			], { title: 'Short text', description: 'Two to four characters.' });
			const definition = {
				type: 'string', title: 'Explicit title',
				description: 'Explicit description',
			};
			const explicit = new TrimSanitizer({
				title: 'Ignored title', description: 'Ignored description',
				isNullable: true,
				jsonSchema: { input: definition, output: definition },
			});
			for (const direction of ['input', 'output'] as const) {
				const composed = schema.toJsonSchema(direction, {
					target: 'draft-07',
				});
				expect(composed['title']).toBe('Short text');
				expect(composed['description'])
					.toBe('Two to four characters.');
				const exported = explicit.toJsonSchema(direction, {
					target: 'draft-07',
				});
				expect(exported).toEqual({
					title: 'Explicit title',
					description: 'Explicit description',
					anyOf: [definition, { type: 'null' }],
				});
				const branches = exported['anyOf'] as JsonSchema[];
				branches[0]['description'] = 'Mutated export';
				expect(definition.description).toBe('Explicit description');
			}
		});

	for (const target of ['draft-07', 'draft-2020-12']) {
		it(`exports nested transformations as valid ${target}`, async () => {
			const schema = new ObjectValSan({
				schema: {
					name: new TrimSanitizer(),
					count: new StringToNumberValSan(),
					enabled: new StringToBooleanValSan(),
					tags: new ArrayValSan({
						schema: new EnumValidator({
							allowedValues: ['one', 'two'],
						}),
					}),
					profile: new ObjectValSan({
						schema: {
							nickname: new TrimSanitizer({ isOptional: true }),
						},
					}),
				},
			});
			const standard: StandardJSONSchemaV1 = schema;
			const converters = standard['~standard'].jsonSchema;
			const input = converters.input({ target });
			const output = converters.output({ target });
			const ajv =
				target === 'draft-07' ? new Ajv() : new Ajv2020();
			const validateInput = ajv.compile(input);
			const validateOutput = ajv.compile(output);
			const value = {
				name: ' Alice ', count: '42', enabled: 'yes',
				tags: ['one'], profile: {},
			};
			expect(validateInput(value)).toBe(true);
			expect(validateOutput(value)).toBe(false);
			const result = await schema.run(value);
			expect(result.success).toBe(true);
			expect(validateOutput(result.data)).toBe(true);
			expect(result.data?.['count']).toBe(42);
			expect(result.data?.['name']).toBe('Alice');
			expect(validateInput({ ...value, extra: true })).toBe(false);
			expect(validateInput({ ...value, count: false })).toBe(false);
		});
	}

	it('exports required, nullable, and undefinable fields', () => {
		const schema = new ObjectValSan({
			schema: {
				required: new TrimSanitizer(),
				nullable: new TrimSanitizer({ isNullable: true }),
				undefinable: new TrimSanitizer({ isUndefinable: true }),
				optional: new TrimSanitizer({ isOptional: true }),
				overridden: new TrimSanitizer({
					isOptional: true, isUndefinable: false, isNullable: false,
				}),
			},
		});
		const json = schema['~standard'].jsonSchema.input({
			target: 'draft-07',
		});
		expect(json['required']).toEqual([
			'required', 'nullable', 'overridden',
		]);
		const validate = new Ajv().compile(json);
		expect(validate({
			required: 'a', nullable: null, overridden: 'b',
		})).toBe(true);
		expect(validate({
			required: 'a', nullable: 'b', overridden: null,
		})).toBe(false);
	});

	it('matches container runtime nullish options in both export directions',
		async () => {
			for (const [options, nullable, undefinable] of [
				[{}, false, false],
				[{ isNullable: true }, true, false],
				[{ isUndefinable: true }, false, true],
				[{ isOptional: true }, true, true],
				[{
					isOptional: true, isNullable: false, isUndefinable: false,
				}, false, false],
			] as const) {
				for (const schema of [
					new ObjectValSan({ schema: {}, ...options }),
					new ArrayValSan({
						schema: new TrimSanitizer(), ...options,
					}),
				]) {
					expect((await schema.run(null)).success).toBe(nullable);
					expect((await schema.run(undefined)).success)
						.toBe(undefinable);
					expect(schema.jsonSchemaAllowsUndefined).toBe(undefinable);
					for (const direction of ['input', 'output'] as const) {
						const validate = new Ajv().compile(schema.toJsonSchema(
							direction, { target: 'draft-07' }
						));
						expect(validate(null)).toBe(nullable);
						const parent = new ObjectValSan({
							schema: { child: schema },
						});
						expect(new Ajv().compile(parent.toJsonSchema(
							direction, { target: 'draft-07' }
						))({})).toBe(undefinable);
					}
				}
			}
		});

	it('rejects undefinable containers as array elements', () => {
		for (const child of [
			new ObjectValSan({ schema: {}, isUndefinable: true }),
			new ArrayValSan({
				schema: new TrimSanitizer(), isUndefinable: true,
			}),
		]) {
			for (const direction of ['input', 'output'] as const) {
				expect(() => new ArrayValSan({ schema: child }).toJsonSchema(
					direction, { target: 'draft-07' }
				)).toThrowError(TypeError, /Undefined array elements/);
			}
		}
	});

	it('exports additional properties according to the runtime policy', () => {
		const schema = new ObjectValSan({
			schema: {}, allowAdditionalProperties: true,
		});
		expect(schema.toJsonSchema('input', { target: 'draft-07' }))
			.toEqual(documented(schema, {
				type: 'object', properties: {}, required: [],
				additionalProperties: true,
			}));
	});

	it('exports primitive input/output shapes and constraints', () => {
		const options = { target: 'draft-07' };
		for (const schema of [
			new TrimSanitizer(), new LowercaseSanitizer(),
			new UppercaseSanitizer(),
		]) {
			expect(schema.toJsonSchema('input', options))
				.toEqual(documented(schema, { type: 'string' }));
			expect(schema.toJsonSchema('output', options))
				.toEqual(documented(schema, { type: 'string' }));
		}
		const cases: Array<[ValSan, JsonSchema]> = [
			[new IntegerValidator(), { type: 'integer' }],
			[new MinValidator({ min: 1 }), { type: 'number', minimum: 1 }],
			[new MaxValidator({ max: 3 }), { type: 'number', maximum: 3 }],
			[new RangeValidator({ min: 1, max: 3 }), {
				type: 'number', minimum: 1, maximum: 3,
			}],
			[new MinLengthValidator({ minLength: 2 }), {
				type: 'string', minLength: 2,
			}],
			[new MaxLengthValidator({ maxLength: 4 }), {
				type: 'string', maxLength: 4,
			}],
			[new MaxLengthValidator({ maxLength: Infinity }), {
				type: 'string',
			}],
			[new PatternValidator({ pattern: /^a+$/ }), {
				type: 'string', pattern: '^a+$',
			}],
			[new EmailValidator(), {
				type: 'string', format: 'email', maxLength: 254,
			}],
			[new EnumValidator({ allowedValues: ['a', 'a', 'b'] }), {
				enum: ['a', 'b'],
			}],
		];
		for (const [schema, expected] of cases) {
			expect(schema.toJsonSchema('output', options))
				.toEqual(documented(schema, expected));
		}
		const integer = new IntegerValidator();
		expect(integer.toJsonSchema('input', options))
			.toEqual(documented(integer, {
				anyOf: [{ type: 'integer' }, { type: 'string' }],
			}));
	});

	it('exports length constraints as a flat string schema', () => {
		const schema = new LengthValidator({ minLength: 2, maxLength: 4 });
		expect(schema.jsonSchemaPreservesInput).toBe(true);
		const json = schema['~standard'].jsonSchema.input({
			target: 'draft-07',
		});
		expect(json).toEqual(documented(schema, {
			type: 'string', minLength: 2, maxLength: 4,
		}));
		const validate = new Ajv().compile(json);
		expect(validate('abc')).toBe(true);
		expect(validate('a')).toBe(false);
		expect(validate('abcde')).toBe(false);
		expect(schema['~standard'].jsonSchema.output({
			target: 'draft-07',
		})).toEqual(json);
		expect(new PatternValidator({ pattern: /^a$/ })
			.jsonSchemaPreservesInput).toBe(true);
		expect(new EmailValidator().jsonSchemaPreservesInput).toBe(true);
		expect(new EnumValidator({ allowedValues: ['a'] })
			.jsonSchemaPreservesInput).toBe(true);
	});

	it('exports workflow length fields as strings without object defaults',
		() => {
			const field = new LengthValidator({
				minLength: 0, maxLength: 255, description: 'Example field',
			});
			const schema = new ObjectValSan({
				schema: { exampleField: field },
			});
			for (const target of ['draft-07', 'draft-2020-12']) {
				for (const direction of ['input', 'output'] as const) {
					const json = schema.toJsonSchema(direction, { target });
					const properties =
						json['properties'] as Record<string, JsonSchema>;
					expect(properties['exampleField']).toEqual({
						type: 'string', minLength: 0, maxLength: 255,
						title: 'String length', description: 'Example field',
					});
					expect(properties['exampleField']['allOf'])
						.toBeUndefined();
					expect(properties['exampleField']['default'])
						.toBeUndefined();
					const ajv =
						target === 'draft-07' ? new Ajv() : new Ajv2020();
					const validate = ajv.compile(json);
					expect(validate({ exampleField: '' })).toBe(true);
					expect(validate({ exampleField: 'a'.repeat(255) }))
						.toBe(true);
					expect(validate({ exampleField: 'a'.repeat(256) }))
						.toBe(false);
					expect(validate({ exampleField: {} })).toBe(false);
				}
			}
			expect(new LengthValidator().toJsonSchema(
				'input', { target: 'draft-07' }
			)).toEqual(documented(new LengthValidator(), {
				type: 'string', minLength: 1,
			}));
		});

	it('preserves explicit schemas in modified length compositions', () => {
		const schema = new LengthValidator({ minLength: 2, maxLength: 4 });
		schema.steps[0] = new MinLengthValidator({
			minLength: 2,
			jsonSchema: {
				input: { type: 'string', const: 'abc' },
				output: { type: 'string', const: 'abc' },
			},
		});
		const json = schema.toJsonSchema('input', { target: 'draft-07' });
		expect(json['allOf']).toBeDefined();
		const validate = new Ajv().compile(json);
		expect(validate('abc')).toBe(true);
		expect(validate('abcd')).toBe(false);
		const extended = new LengthValidator();
		extended.steps.push(new MinLengthValidator({ minLength: 2 }));
		expect(extended.toJsonSchema(
			'input', { target: 'draft-07' }
		)).toEqual(documented(extended, { type: 'string', minLength: 2 }));
		class CustomMin extends MinLengthValidator {
			protected override jsonSchemaDefinition() {
				return { type: 'string', pattern: '^a' };
			}
		}
		const custom = new LengthValidator();
		custom.steps[0] = new CustomMin();
		expect(custom.toJsonSchema(
			'input', { target: 'draft-07' }
		)).toEqual(documented(custom, { type: 'string', pattern: '^a' }));
	});

	it('keeps transforming length subclasses subject to composition checks',
		() => {
			class Transforming extends LengthValidator {
				constructor() {
					super();
					this.steps.push(new TrimSanitizer());
				}
			}
			expect(() => new Transforming().toJsonSchema(
				'input', { target: 'draft-07' }
			)).toThrowError(TypeError, /Transforming compositions/);
		});

	it('exports single transforms but rejects unsafe pipelines', () => {
		const one = new ComposedValSan([new StringToNumberValSan()]);
		expect(one.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(new StringToNumberValSan(), {
				type: 'number',
			}));
		const multiple = new ComposedValSan([
			new TrimSanitizer(), new MinLengthValidator(),
		]);
		expect(() => multiple.toJsonSchema('input', { target: 'draft-07' }))
			.toThrowError(
				TypeError,
				'Transforming compositions require explicit options.jsonSchema'
			);
	});

	it('supports explicit schemas and runtime transformations', async () => {
		const schema = new ComposedValSan<string, number>(
			[new TrimSanitizer(), new StringToNumberValSan()],
			{ jsonSchema: {
				input: { type: 'string' }, output: { type: 'number' },
			} }
		);
		expect(schema.toJsonSchema('input', { target: 'draft-07' }))
			.toEqual(documented(schema, { type: 'string' }));
		expect(schema.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(schema, { type: 'number' }));
		expect(await schema['~standard'].validate(' 42 '))
			.toEqual({ value: 42 });
	});

	it('supports custom subclass conversion and explicit overrides', () => {
		class Custom extends ValSan<string, string> {
			protected override async validate() {
				return this.pass();
			}

			protected override async sanitize(input: string) {
				return input.trim();
			}

			protected override jsonSchemaDefinition(
				direction: JsonSchemaDirection
			) {
				return { type: 'string', description: direction };
			}
		}
		const schema = new Custom();
		expect(schema.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(schema, {
				type: 'string', description: 'output',
			}));
		const overridden = new Custom({
			jsonSchema: {
				input: { type: 'string' }, output: { const: 'provided' },
			},
		});
		expect(overridden.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(overridden, { const: 'provided' }));
	});

	it('preserves external converter receivers and options', () => {
		const jsonSchema = {
			marker: 'external',
			input(options: JsonSchemaOptions) {
				return {
					type: 'string',
					description: `${this.marker}:${options.target}`,
				};
			},
			output() {
				return { type: 'number' };
			},
		};
		const schema: StandardSchemaV1 & StandardJSONSchemaV1 = {
			'~standard': {
				version: 1, vendor: 'external', jsonSchema,
				validate: () => ({ value: 42 }),
			},
		};
		const spy = spyOn(jsonSchema, 'input').and.callThrough();
		const options = {
			target: 'draft-07', libraryOptions: { external: true },
		};
		expect(exportChildSchema(schema, 'input', options)).toEqual({
			type: 'string', description: 'external:draft-07',
		});
		expect(spy).toHaveBeenCalledWith(options);
		expect(exportChildSchema(schema, 'output', options))
			.toEqual({ type: 'number' });
	});

	it('rejects unsupported targets, custom validators, and cycles', () => {
		expect(() => new TrimSanitizer().toJsonSchema(
			'input', { target: 'openapi-3.0' }
		)).toThrowError(TypeError, /Unsupported JSON Schema target/);
		class Unsupported extends ValSan<string> {
			protected override async validate() {
				return this.pass();
			}
			protected override async sanitize(input: string) {
				return input;
			}
		}
		const schema = new Unsupported();
		expect(() => schema.toJsonSchema('input', { target: 'draft-07' }))
			.toThrowError(TypeError, /does not support JSON Schema export/);
		const object = new ObjectValSan({ schema: {} as ObjectSchema });
		object.schema['self'] = object;
		expect(() => object.toJsonSchema('input', { target: 'draft-07' }))
			.toThrowError(TypeError, /Cyclic schemas/);
		delete object.schema['self'];
		expect(object.toJsonSchema('input', { target: 'draft-07' })['type'])
			.toBe('object');
	});

	it('rejects validation-only children and malformed exports', () => {
		const validationOnly: StandardSchemaV1 = {
			'~standard': {
				version: 1, vendor: 'test', validate: () => ({ value: 'a' }),
			},
		};
		expect(() => exportChildSchema(
			validationOnly, 'input', { target: 'draft-07' }
		)).toThrowError(TypeError, /does not support Standard JSON Schema/);
		for (const jsonSchema of [
			null, {}, { input: 42 }, { input: () => null },
			{ input: () => [] },
		]) {
			const child = {
				...validationOnly,
				'~standard': { ...validationOnly['~standard'], jsonSchema },
			};
			expect(() => exportChildSchema(
				child, 'input', { target: 'draft-07' }
			)).toThrowError(TypeError);
		}
	});

	it('rejects unsupported refinements and non-JSON array elements', () => {
		for (const schema of [
			new PatternValidator({ pattern: /abc/i }),
			new EmailValidator({ allowedDomains: ['example.com'] }),
			new EmailValidator({ allowPlusAddress: false }),
			new MinLengthValidator({ minLength: -1 }),
			new MaxLengthValidator({ maxLength: NaN }),
			new MinValidator({ min: Infinity }),
			new MaxValidator({ max: NaN }),
			new RangeValidator({ min: 4, max: 1 }),
			new RangeValidator({ min: 0, max: Infinity }),
			new EnumValidator({ allowedValues: [] }),
			new EnumValidator({ allowedValues: [{}] }),
			new EnumValidator({ allowedValues: [Infinity] }),
			new ArrayValSan({
				schema: new TrimSanitizer({ isOptional: true }),
			}),
		]) {
			expect(() => schema.toJsonSchema(
				'input', { target: 'draft-07' }
			)).toThrowError(TypeError);
		}
	});

	it('exports nullable arrays and primitive enum values', () => {
		const schema = new ArrayValSan({
			schema: new EnumValidator({ allowedValues: [1, true] }),
			isOptional: true,
		});
		expect(schema.jsonSchemaAllowsUndefined).toBe(true);
		expect(schema.toJsonSchema('input', { target: 'draft-07' }))
			.toEqual(documented(schema, {
				anyOf: [
					{ type: 'array', items: documented(
						new EnumValidator({ allowedValues: [1, true] }),
						{ enum: [1, true] }
					) },
					{ type: 'null' },
				],
			}));
	});

	it('rejects native children without export and malformed metadata', () => {
		const native = {
			type: 'unknown' as const,
			example: '',
			options: {},
			getTitle: () => 'Native test schema',
			getDescription: () => undefined,
			rules: () => ({}),
			run: async (value: unknown) => ({
				success: true as const, data: value, errors: [] as [],
			}),
		};
		expect(() => exportChildSchema(
			native, 'input', { target: 'draft-07' }
		)).toThrowError(TypeError, /does not support Standard JSON Schema/);
		const malformed = { ...native, '~standard': null };
		expect(() => exportChildSchema(
			malformed, 'input', { target: 'draft-07' }
		)).toThrowError(TypeError, /does not support Standard JSON Schema/);
	});

	it('rejects child references rather than rebasing them incorrectly', () => {
		const schema: StandardSchemaV1 & StandardJSONSchemaV1 = {
			'~standard': {
				version: 1, vendor: 'external',
				validate: () => ({ value: 'a' }),
				jsonSchema: {
					input: () => ({
						$ref: '#/$defs/value',
						$defs: { value: { type: 'string' } },
					}),
					output: () => ({ type: 'string' }),
				},
			},
		};
		expect(() => new ArrayValSan({ schema }).toJsonSchema(
			'input', { target: 'draft-07' }
		)).toThrowError(TypeError, /Reference-bearing child schemas/);
		const cycle: JsonSchema = {};
		cycle['allOf'] = [cycle];
		spyOn(schema['~standard'].jsonSchema, 'input').and.returnValue(cycle);
		expect(() => exportChildSchema(
			schema, 'input', { target: 'draft-07' }
		)).toThrowError(TypeError, /Cyclic JSON Schema conversion result/);
	});

	it('returns independent exports and preserves unusual object keys', () => {
		const schema = new ObjectValSan({
			schema: { ['__proto__']: new TrimSanitizer() },
			isOptional: true,
		});
		const first = schema.toJsonSchema('input', { target: 'draft-07' });
		const second = schema.toJsonSchema('input', { target: 'draft-07' });
		expect(first).toEqual(second);
		expect(first).not.toBe(second);
		expect(JSON.stringify(first)).toContain('"__proto__"');
	});

	it('derives annotated custom rules from runtime type metadata', () => {
		class Custom extends MinValidator {
			override rules() {
				return {
					...super.rules(),
					stricter: {
						code: 'custom_minimum',
						user: { helperText: 'At least 5', errorMessage: 'Low' },
						jsonSchema: { minimum: 5 },
					},
				};
			}
		}
		const custom = new Custom({ min: 2 });
		expect(custom.toJsonSchema(
			'output', { target: 'draft-07' }
		)).toEqual(documented(custom, { type: 'number', minimum: 5 }));
		class Unsupported extends ValSan<number> {
			override type = 'number' as const;
			override rules() {
				return new MinValidator({ min: 2 }).rules();
			}
			protected override async validate() {
				return this.pass();
			}
			protected override async sanitize(input: number) {
				return input;
			}
		}
		const unsupported = new Unsupported();
		expect(unsupported.toJsonSchema(
			'output', { target: 'draft-07' }
		)).toEqual(documented(unsupported, { type: 'number', minimum: 2 }));
	});

	it('derives richer semantic rules without conversion hooks', () => {
		const details = {
			code: 'custom', user: { helperText: '', errorMessage: '' },
		};
		const rules: RuleSet = {
			pattern: {
				...details, kind: 'string.pattern',
				context: { regex: /^a/, pattern: '/^a/' },
			},
			secondPattern: {
				...details, kind: 'string.pattern',
				context: { regex: /z$/, pattern: '/z$/' },
			},
			enum: {
				...details, kind: 'value.enum',
				context: { allowedValues: ['az', 'ab', 'az'] },
			},
			secondEnum: {
				...details, kind: 'value.enum',
				context: { allowedValues: ['az', 'bz'] },
			},
		};
		for (const target of ['draft-07', 'draft-2020-12']) {
			const ajv = target === 'draft-07' ? new Ajv() : new Ajv2020();
			for (const direction of ['input', 'output'] as const) {
				const json = deriveRuleSchema({
					input: 'string', output: 'string',
				}, rules, direction);
				expect(json).toEqual({
					type: 'string', enum: ['az'],
					allOf: [{ pattern: '^a' }, { pattern: 'z$' }],
				});
				const validate = ajv.compile(json);
				expect(validate('az')).toBe(true);
				expect(validate('ab')).toBe(false);
				expect(validate('bz')).toBe(false);
			}
		}
		expect(new PatternValidator({ pattern: /^a$/ }).rules().pattern.kind)
			.toBe('string.pattern');
		expect(new EnumValidator({ allowedValues: [true] }).rules().enum.kind)
			.toBe('value.enum');
		expect(new EmailValidator().rules().invalid.kind)
			.toBe('string.email');
	});

	it('preserves explicit overrides for richer kinds', () => {
		const rule: Rule = {
			code: 'custom', user: { helperText: '', errorMessage: '' },
			kind: 'string.pattern',
			context: { regex: /abc/i, pattern: '/abc/i' },
			jsonSchema: { pattern: '^a' },
		};
		expect(deriveRuleSchema({
			input: 'string', output: 'string',
		}, { rule }, 'output')).toEqual({ type: 'string', pattern: '^a' });
		expect(deriveRuleSchema({
			input: 'string', output: 'string',
		}, {
			first: rule, second: rule,
		}, 'output')).toEqual({ type: 'string', pattern: '^a' });
	});

	it('rejects malformed rich rule context and incompatible metadata', () => {
		const details = {
			code: 'invalid', user: { helperText: '', errorMessage: '' },
		};
		for (const metadata of [
			{ kind: 'string.pattern', context: { regex: 'abc' } },
			{ kind: 'string.pattern' },
			{ kind: 'string.email' },
			{ kind: 'string.emailDomains' },
			{ kind: 'value.enum' },
			{ kind: 'value.enum', context: { allowedValues: [] } },
			{ jsonSchema: { enum: [null] } },
			{ jsonSchema: { pattern: 42 } },
			{ jsonSchema: { format: 'uri' } },
		]) {
			const rule = { ...details, ...metadata } as Rule;
			expect(() => deriveRuleSchema({
				input: 'string', output: 'string',
			}, { rule }, 'output')).toThrowError(TypeError);
		}
		expect(() => deriveRuleSchema({
			input: 'string', output: 'string',
		}, {
			first: { ...details, jsonSchema: { enum: ['a'] } },
			second: { ...details, jsonSchema: { enum: ['b'] } },
		}, 'output')).toThrowError(TypeError, /enum intersection is empty/);
	});

	it('flattens compatible primitives and preserves other intersections',
		() => {
			expect(intersectPrimitiveSchemas([
				{ type: 'number', minimum: 1, maximum: 10 },
				{ type: 'number', minimum: 3, maximum: 8 },
			])).toEqual({ type: 'number', minimum: 3, maximum: 8 });
			expect(intersectPrimitiveSchemas([
				{ type: 'string', pattern: '^a', enum: ['az', 'ab'] },
				{ type: 'string', pattern: 'z$', enum: ['az', 'bz'] },
			])).toEqual({
				type: 'string', enum: ['az'],
				allOf: [{ pattern: '^a' }, { pattern: 'z$' }],
			});
			expect(intersectPrimitiveSchemas([
				{ type: 'string' }, { type: 'string', minLength: 2 },
			])).toEqual({ type: 'string', minLength: 2 });
			for (const schemas of [
				[],
				[{ type: 'object' }, { type: 'object' }],
				[{ type: 'string' }, { type: 'number' }],
				[{ type: 'string' }, { type: 'string', default: 'abc' }],
				[{ type: 'string' }, { type: 'string', const: 'abc' }],
				[{ type: 'string' }, { anyOf: [{ type: 'string' }] }],
				[{ type: 'string' }, { type: 'string', format: 'uri' }],
			]) {
				expect(intersectPrimitiveSchemas(schemas)).toEqual({
					allOf: schemas,
				});
			}
			expect(intersectPrimitiveSchemas([
				{ type: 'boolean' }, { type: 'boolean' },
			])).toEqual({ type: 'boolean' });
			expect(intersectPrimitiveSchemas([
				{ type: 'integer' }, { type: 'integer', minimum: 1 },
			])).toEqual({ type: 'integer', minimum: 1 });
			expect(() => intersectPrimitiveSchemas([
				{ type: 'string', minLength: 4 },
				{ type: 'string', maxLength: 2 },
			])).toThrowError(TypeError, /length requires ordered bounds/);
		});

	it('requires typed context for richer rule kinds', () => {
		const check = (rule: Rule) => rule;
		const details = {
			code: 'custom', user: { helperText: '', errorMessage: '' },
		};
		// @ts-expect-error Pattern rules require a RegExp.
		check({ ...details, kind: 'string.pattern', context: { regex: 'a' } });
		// @ts-expect-error Enum rules require an array.
		check({ ...details, kind: 'value.enum',
			context: { allowedValues: 1 } });
		// @ts-expect-error Email rules require their addressing policy.
		check({ ...details, kind: 'string.email', context: {} });
	});

	it('preserves runtime conjunction when flattening pattern compositions',
		async () => {
			const schema = new ComposedValSan([
				new PatternValidator({ pattern: /^a/ }),
				new PatternValidator({ pattern: /z$/ }),
				new MinLengthValidator({ minLength: 3 }),
			]);
			for (const target of ['draft-07', 'draft-2020-12']) {
				for (const direction of ['input', 'output'] as const) {
					const json = schema.toJsonSchema(direction, { target });
					expect(json).toEqual(documented(schema, {
						type: 'string', minLength: 3,
						allOf: [{ pattern: '^a' }, { pattern: 'z$' }],
					}));
					const ajv =
						target === 'draft-07' ? new Ajv() : new Ajv2020();
					const validate = ajv.compile(json);
					for (const value of ['abz', 'az', 'ab', 'bz']) {
						expect(validate(value)).toBe(
							(await schema.run(value)).success
						);
					}
				}
			}
		});

	it('derives recognized constraint kinds from typed context', () => {
		const cases: Array<[JsonSchemaShapes, RuleConstraint, JsonSchema]> = [
			[
				{ input: 'number', output: 'number' },
				{ kind: 'number.minimum', context: { min: 2 } },
				{ type: 'number', minimum: 2 },
			],
			[
				{ input: 'number', output: 'number' },
				{ kind: 'number.maximum', context: { max: 8 } },
				{ type: 'number', maximum: 8 },
			],
			[
				{ input: 'number', output: 'number' },
				{ kind: 'number.range', context: { min: 2, max: 8 } },
				{ type: 'number', minimum: 2, maximum: 8 },
			],
			[
				{ input: 'string', output: 'string' },
				{ kind: 'string.minLength', context: { minLength: 2 } },
				{ type: 'string', minLength: 2 },
			],
			[
				{ input: 'string', output: 'string' },
				{ kind: 'string.maxLength', context: { maxLength: 8 } },
				{ type: 'string', maxLength: 8 },
			],
			[
				{ input: 'string', output: 'string' },
				{ kind: 'string.maxLength', context: { maxLength: Infinity } },
				{ type: 'string' },
			],
		];
		for (const [shapes, constraint, expected] of cases) {
			const rule: Rule = {
				...constraint,
				code: 'custom_error_code',
				user: { helperText: '', errorMessage: '' },
			};
			for (const direction of ['input', 'output'] as const) {
				expect(deriveRuleSchema(shapes, { rule }, direction))
					.toEqual(expected);
			}
		}
	});

	it('exports semantic type checks without empty rule metadata', () => {
		for (const [kind, type] of [
			['type.string', 'string'],
			['type.number', 'number'],
			['type.integer', 'integer'],
			['type.boolean', 'boolean'],
		] as const) {
			const rule: Rule = {
				kind, code: 'type_check',
				user: { helperText: '', errorMessage: '' },
			};

			for (const direction of ['input', 'output'] as const) {
				expect(deriveRuleSchema(
					{ input: type, output: type }, { rule }, direction
				)).toEqual({ type });
			}
		}

		expect(new IntegerValidator().rules().integer.kind)
			.toBe('type.integer');
		expect(new MinValidator({ min: 1 }).rules().number.jsonSchema)
			.toBeUndefined();
		expect(new TrimSanitizer().rules().string.kind).toBe('type.string');
	});

	it('supports explicit type-only approximations', () => {
		const rule: Rule = {
			jsonSchema: 'type-only', code: 'transformation',
			user: { helperText: '', errorMessage: '' },
		};
		const shapes: JsonSchemaShapes = {
			input: 'string', output: 'boolean',
		};

		expect(deriveRuleSchema(shapes, { rule }, 'input'))
			.toEqual({ type: 'string' });
		expect(deriveRuleSchema(shapes, { rule }, 'output'))
			.toEqual({ type: 'boolean' });
		expect(new StringToBooleanValSan().rules().booleanString.jsonSchema)
			.toBe('type-only');
	});

	it('rejects empty rule metadata in types and at runtime', () => {
		const rule: Rule = {
			code: 'empty', user: { helperText: '', errorMessage: '' },
			// @ts-expect-error Explicit metadata requires a constraint.
			jsonSchema: {},
		};
		expect(() => deriveRuleSchema(
			{ input: 'string', output: 'string' }, { rule }, 'output'
		)).toThrowError(TypeError, /empty JSON Schema constraint metadata/);
	});

	it('keeps explicit constraints ahead of semantic type kinds', () => {
		expect(deriveRuleSchema(
			{ input: 'string', output: 'string' },
			{
				rule: {
					kind: 'type.string', code: 'type_check',
					jsonSchema: { minLength: 3 },
					user: { helperText: '', errorMessage: '' },
				},
			},
			'output'
		)).toEqual({ type: 'string', minLength: 3 });
	});

	it('merges context-derived bounds with explicit custom constraints', () => {
		const rules: RuleSet = {
			min: {
				kind: 'number.minimum', context: { min: 2 },
				code: 'min', user: { helperText: '', errorMessage: '' },
			},
			max: {
				kind: 'number.maximum', context: { max: 10 },
				code: 'max', user: { helperText: '', errorMessage: '' },
			},
			custom: {
				jsonSchema: { minimum: 5, maximum: 8 },
				code: 'custom', user: { helperText: '', errorMessage: '' },
			},
		};
		expect(deriveRuleSchema(
			{ input: ['number', 'string'], output: 'number' }, rules, 'input'
		)).toEqual({
			anyOf: [
				{ type: 'number', minimum: 5, maximum: 8 },
				{ type: 'string' },
			],
		});
	});

	it('allows explicit rule metadata to override context derivation', () => {
		expect(deriveRuleSchema(
			{ input: 'number', output: 'number' },
			{
				min: {
					kind: 'number.minimum', context: { min: Infinity },
					jsonSchema: { minimum: 3 },
					code: 'min', user: { helperText: '', errorMessage: '' },
				},
			},
			'output'
		)).toEqual({ type: 'number', minimum: 3 });
	});

	it('rejects invalid constraint context and unknown kinds', () => {
		const cases: Array<[JsonSchemaShapes, unknown]> = [
			[{ input: 'number', output: 'number' },
				{ kind: 'number.minimum' }],
			[{ input: 'number', output: 'number' },
				{ kind: 'number.maximum', context: {} }],
			[{ input: 'number', output: 'number' },
				{ kind: 'number.range', context: { min: 3, max: 2 } }],
			[{ input: 'number', output: 'number' },
				{ kind: 'number.minimum', context: { min: '2' } }],
			[{ input: 'string', output: 'string' },
				{ kind: 'string.minLength', context: { minLength: -1 } }],
			[{ input: 'string', output: 'string' },
				{ kind: 'string.maxLength', context: { maxLength: 1.5 } }],
			[{ input: 'string', output: 'string' },
				{ kind: 'number.minimum', context: { min: 2 } }],
			[{ input: 'number', output: 'number' },
				{ kind: 'number.exclusiveMinimum', context: { min: 2 } }],
		];
		for (const [shapes, constraint] of cases) {
			const rule = Object.assign({
				code: 'custom', user: { helperText: '', errorMessage: '' },
			}, constraint) as Rule;
			expect(() => deriveRuleSchema(shapes, { rule }, 'output'))
				.toThrowError(TypeError);
		}
	});

	it('does not infer constraints from diagnostic context or codes', () => {
		expect(() => deriveRuleSchema(
			{ input: 'number', output: 'number' },
			{
				min: {
					code: 'minimum', context: { min: 2 },
					user: { helperText: '', errorMessage: '' },
				},
			},
			'output'
		)).toThrowError(TypeError, /has no JSON Schema constraint metadata/);
	});

	it('requires matching context in constraint rule types', () => {
		const check = (rule: Rule): Rule => rule;
		const details = {
			code: 'custom', user: { helperText: '', errorMessage: '' },
		};
		// @ts-expect-error Recognized constraints require context.
		check({ ...details, kind: 'number.minimum' });
		// @ts-expect-error Numeric bounds must be numbers.
		check({ ...details, kind: 'number.minimum', context: { min: '2' } });
		// @ts-expect-error Constraint context must match its kind.
		check({ ...details, kind: 'string.minLength', context: { min: 2 } });
		// @ts-expect-error A numeric range requires both bounds.
		check({ ...details, kind: 'number.range', context: { min: 2 } });
	});

	it('merges repeated bounds using the strongest constraints', () => {
		const rule = (jsonSchema: RuleSet[string]['jsonSchema']) => ({
			code: 'constraint',
			user: { helperText: '', errorMessage: '' },
			jsonSchema,
		});
		expect(deriveRuleSchema(
			{ input: ['number', 'string'], output: 'number' },
			{
				first: rule({ minimum: 1, maximum: 20 }),
				second: rule({ minimum: 2, maximum: 10 }),
				third: rule({ minimum: 0, maximum: 30 }),
			},
			'input'
		)).toEqual({
			anyOf: [
				{ type: 'number', minimum: 2, maximum: 10 },
				{ type: 'string' },
			],
		});
		expect(deriveRuleSchema(
			{ input: 'string', output: 'string' },
			{
				first: rule({ minLength: 1, maxLength: 20 }),
				second: rule({ minLength: 2, maxLength: 10 }),
				third: rule({ minLength: 0, maxLength: 30 }),
			},
			'output'
		)).toEqual({ type: 'string', minLength: 2, maxLength: 10 });
	});

	it('rejects unannotated rules and incompatible constraint metadata', () => {
		const string: JsonSchemaShapes = { input: 'string', output: 'string' };
		const number: JsonSchemaShapes = {
			input: ['number', 'string'], output: 'number',
		};
		const cases: Array<[JsonSchemaShapes, unknown]> = [
			[string, undefined],
			[string, { minimum: 1 }],
			[number, { minLength: 1 }],
			[number, { pattern: '^a' }],
			[string, { multipleOf: 2 }],
			[string, { minLength: 1.5 }],
			[string, { maxLength: -1 }],
			[number, { minimum: NaN }],
			[number, { maximum: Infinity }],
			[number, { minimum: 3, maximum: 2 }],
		];
		for (const [shapes, metadata] of cases) {
			const jsonSchema = metadata as RuleSet[string]['jsonSchema'];
			expect(() => deriveRuleSchema(shapes, {
				custom: {
					code: 'custom',
					user: { helperText: '', errorMessage: '' },
					jsonSchema,
				},
			}, 'output')).toThrowError(TypeError);
		}
	});

	it('keeps explicit definitions ahead of rule derivation', () => {
		const schema = new MinValidator({
			min: Infinity,
			jsonSchema: {
				input: { type: 'string' },
				output: { type: 'number', description: 'Explicit' },
			},
		});
		expect(schema.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(schema, {
				type: 'number', description: 'Explicit',
			}));
	});

	it('derives primitive shapes from type and independent overrides', () => {
		class SameType extends ValSan {
			override rules() {
				return {
					shape: {
						code: 'shape', jsonSchema: 'type-only' as const,
						user: { helperText: '', errorMessage: '' },
					},
				};
			}

			constructor(
				override type: ValSanTypes,
				options: ValSanOptions = {}
			) {
				super(options);
			}

			protected override async validate() {
				return this.pass();
			}

			protected override async sanitize(input: unknown) {
				return input;
			}
		}
		for (const type of [
			'string', 'number', 'integer', 'boolean',
		] as const) {
			const schema = new SameType(type);
			for (const direction of ['input', 'output'] as const) {
				expect(schema.toJsonSchema(direction, { target: 'draft-07' }))
					.toEqual(documented(schema, { type }));
			}
			expect(schema.jsonSchemaPreservesInput).toBe(false);
		}
		for (const type of ['object', 'array', 'file', 'unknown'] as const) {
			expect(() => new SameType(type).toJsonSchema(
				'input', { target: 'draft-07' }
			)).toThrowError(TypeError, /Cannot derive primitive JSON Schema/);
		}
		const explicit = new SameType('unknown', {
			jsonSchema: {
				input: { type: 'string' }, output: { type: 'boolean' },
			},
		});
		expect(explicit.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(explicit, { type: 'boolean' }));
		class Transform extends SameType {
			override inputType = 'string' as const;
		}
		const transform = new Transform('number');
		expect(transform.toJsonSchema(
			'input', { target: 'draft-07' }
		)).toEqual(documented(transform, { type: 'string' }));
		const outputOnly = new SameType('string');
		outputOnly.outputType = 'boolean';
		expect(outputOnly.toJsonSchema('input', { target: 'draft-07' }))
			.toEqual(documented(outputOnly, { type: 'string' }));
		expect(outputOnly.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(outputOnly, { type: 'boolean' }));
		outputOnly.inputType = ['string', 'boolean'];
		outputOnly.outputType = ['boolean', 'string', 'boolean'];
		expect(outputOnly.toJsonSchema('output', { target: 'draft-07' }))
			.toEqual(documented(outputOnly, {
				anyOf: [{ type: 'boolean' }, { type: 'string' }],
			}));
		expect(outputOnly.toJsonSchema('input', { target: 'draft-07' }))
			.toEqual(documented(outputOnly, {
				anyOf: [{ type: 'string' }, { type: 'boolean' }],
			}));
		outputOnly.inputType = [];
		expect(() => outputOnly.toJsonSchema('input', { target: 'draft-07' }))
			.toThrowError(TypeError, /type unions cannot be empty/);
	});

	it('still requires rule metadata for same-type derivation', () => {
		class Unannotated extends TrimSanitizer {
			override rules() {
				return {
					...super.rules(),
					custom: {
						code: 'custom',
						user: { helperText: '', errorMessage: 'Invalid' },
					},
				};
			}
		}
		expect(() => new Unannotated().toJsonSchema(
			'input', { target: 'draft-07' }
		)).toThrowError(TypeError, /has no JSON Schema constraint metadata/);
	});
});
