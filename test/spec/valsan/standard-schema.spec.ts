import 'jasmine';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
	ArrayValSan,
	ComposedValSan,
	ObjectValSan,
	TrimSanitizer,
	StringToNumberValSan,
	ValSan,
	ValidationResult,
} from '../../../src';
import { runSchema } from '../../../src/schema';
import type { SchemaLike } from '../../../src/schema';

describe('Standard Schema interoperability', () => {
	const trimmedStringSchema: StandardSchemaV1<string, string> = {
		'~standard': {
			version: 1,
			vendor: 'test',
			validate: (value) =>
				typeof value === 'string'
					? { value: value.trim() }
					: {
						issues: [{ message: 'Expected a string' }],
					},
		},
	};

	it('exposes ValSan as a Standard Schema with output values', async () => {
		class UppercaseValSan extends ValSan<string, string> {
			override async validate(): Promise<ValidationResult> {
				return this.pass();
			}

			override async sanitize(input: string): Promise<string> {
				return input.toUpperCase();
			}
		}

		const valsan = new UppercaseValSan();
		const standardSchema:
			StandardSchemaV1<string, string | null | undefined> = valsan;
		const success = await standardSchema['~standard'].validate('hello');
		const failure = await standardSchema['~standard'].validate(undefined);

		expect(standardSchema['~standard'].version).toBe(1);
		expect(standardSchema['~standard'].vendor).toBe('valsan');
		expect(success).toEqual({ value: 'HELLO' });
		expect(failure).toEqual({
			issues: [{ message: 'Value is required' }],
		});
	});

	it('includes ValSan error paths in Standard Schema issues', async () => {
		class PathFailureValSan extends ValSan<string, string> {
			override async validate(): Promise<ValidationResult> {
				return {
					isValid: false,
					errors: [
						{
							code: 'invalid_name',
							message: 'Invalid name',
							path: ['name'],
						},
					],
				};
			}

			override async sanitize(input: string): Promise<string> {
				return input;
			}
		}

		const valsan = new PathFailureValSan();
		const result = await valsan['~standard'].validate('invalid');

		expect(result).toEqual({
			issues: [{ message: 'Invalid name', path: ['name'] }],
		});
	});

	it(
		'accepts Standard Schemas for arrays and preserves async transforms',
		async () => {
			const asyncSchema: StandardSchemaV1<string, string> = {
				'~standard': {
					version: 1,
					vendor: 'test',
					validate: async (value) => {
						if (typeof value !== 'string') {
							return {
								issues: [
									{ message: 'Expected a string' },
								],
							};
						}

						return { value: value.trim().toUpperCase() };
					},
				},
			};
			const arrayValSan = new ArrayValSan({
				schema: asyncSchema,
			});
			const result = await arrayValSan.run([' hello ', 'world ']);

			expect(result).toEqual({
				success: true,
				data: ['HELLO', 'WORLD'],
				errors: [],
			});
		}
	);

	it(
		'maps Standard Schema issue paths through nested objects and arrays',
		async () => {
			const issueSchema: StandardSchemaV1<unknown, unknown> = {
				'~standard': {
					version: 1,
					vendor: 'test',
					validate: () => ({
						issues: [
							{
								message: 'Invalid value',
								path: [{ key: 'nested' }, 2],
							},
						],
					}),
				},
			};
			const valsan = new ArrayValSan({
				schema: new ObjectValSan({
					schema: { value: issueSchema },
				}),
			});
			const result = await valsan.run([{ value: 'invalid' }]);

			expect(result.success).toBe(false);
			expect(result.errors).toEqual([
				{
					code: 'standard_schema',
					message: 'Invalid value',
					field: '[0].value',
					path: [0, 'value', 'nested', 2],
				},
			]);
		}
	);

	it('maps Standard Schema issues without paths', async () => {
		const result = await new ObjectValSan({
			schema: { value: trimmedStringSchema },
		}).run({ value: 42 });

		expect(result.success).toBe(false);
		expect(result.errors).toEqual([
			{
				code: 'standard_schema',
				message: 'Expected a string',
				field: 'value',
				path: ['value'],
			},
		]);
	});

	it(
		'does not treat an empty Standard Schema issue list as success',
		async () => {
			const emptyFailure: StandardSchemaV1<unknown, unknown> = {
				'~standard': {
					version: 1,
					vendor: 'test',
					validate: () => ({ issues: [] }),
				},
			};

			const result = await new ObjectValSan({
				schema: { value: emptyFailure },
			}).run({ value: 'anything' });

			expect(result.success).toBe(false);
			expect(result.errors[0].message).toBe(
				'Standard Schema failed without issues'
			);
		}
	);

	it('throws for an unsupported schema implementation', async () => {
		const unsupportedSchema = {} as SchemaLike;

		await expectAsync(
			runSchema(unsupportedSchema, 'value')
		).toBeRejectedWithError(
			TypeError,
			'Schema must implement run() or Standard Schema validation'
		);
	});

	const malformedSchemas: unknown[] = [
		null,
		undefined,
		42,
		'not a schema',
		[],
		{ run: 42 },
		{ '~standard': null },
		{ '~standard': 42 },
		{ '~standard': {} },
		{ '~standard': { validate: 'not a function' } },
	];

	for (const malformed of malformedSchemas) {
		it(`rejects schema ${JSON.stringify(malformed)}`, async () => {
			await expectAsync(
				runSchema(malformed as SchemaLike, 'value')
			).toBeRejectedWithError(
				TypeError,
				'Schema must implement run() or Standard Schema validation'
			);
		});
	}

	const malformedResults: unknown[] = [
		null,
		undefined,
		42,
		[],
		{},
		{ issues: undefined },
		{ issues: null },
		{ issues: 'not an array' },
	];

	for (const malformed of malformedResults) {
		it(`rejects result ${JSON.stringify(malformed)}`, async () => {
			const schema: unknown = {
				'~standard': {
					version: 1,
					vendor: 'test',
					validate: () => malformed,
				},
			};

			await expectAsync(
				runSchema(schema as SchemaLike, 'value')
			).toBeRejectedWithError(
				TypeError,
				'Invalid Standard Schema validation result'
			);
		});
	}

	it('accepts an explicitly undefined success value', async () => {
		const schema: StandardSchemaV1<unknown, undefined> = {
			'~standard': {
				version: 1,
				vendor: 'test',
				validate: () => ({ value: undefined }),
			},
		};

		expect(await runSchema(schema, 'value')).toEqual({
			success: true,
			data: undefined,
			errors: [],
		});
	});

	it('prefers run() and preserves ValSan error metadata', async () => {
		const valsan = new ObjectValSan({ schema: {} });
		const standardSpy = spyOn(valsan['~standard'], 'validate');
		const result = await valsan.run({ unexpected: true });
		const runSpy = spyOn(valsan, 'run').and.resolveTo(result);

		expect(await runSchema(valsan, { unexpected: true })).toEqual(result);
		expect(runSpy).toHaveBeenCalledWith({ unexpected: true });
		expect(standardSpy).not.toHaveBeenCalled();
		expect(result.errors[0].code).toBe('unexpected_field');
	});

	it('falls back to Standard Schema when run is not callable', async () => {
		const schema = { ...trimmedStringSchema, run: false };

		expect(await runSchema(schema, ' hello ')).toEqual({
			success: true,
			data: 'hello',
			errors: [],
		});
	});

	it('propagates exceptions from Standard Schema validation', async () => {
		const error = new Error('Validator failed');
		const schema: StandardSchemaV1 = {
			'~standard': {
				version: 1,
				vendor: 'test',
				validate: async () => {
					throw error;
				},
			},
		};

		await expectAsync(runSchema(schema, 'value')).toBeRejectedWith(error);
	});

	it('preserves raw and wrapped symbols in nested paths', async () => {
		const rawKey = Symbol('key');
		const wrappedKey = Symbol('key');
		const schema: StandardSchemaV1 = {
			'~standard': {
				version: 1,
				vendor: 'test',
				validate: () => ({
					issues: [
						{
							message: 'Invalid symbol value',
							path: [rawKey, { key: wrappedKey }],
						},
					],
				}),
			},
		};
		const valsan = new ArrayValSan({
			schema: new ObjectValSan({ schema: { value: schema } }),
		});
		const result = await valsan.run([{ value: 'invalid' }]);

		expect(result.errors[0].path).toEqual([
			0, 'value', rawKey, wrappedKey,
		]);
		expect(result.errors[0].path?.[2]).toBe(rawKey);
		expect(result.errors[0].path?.[3]).toBe(wrappedKey);
		expect(result.errors[0].field).toBe('[0].value');
		expect(await valsan['~standard'].validate([{ value: 'invalid' }]))
			.toEqual({
				issues: [
					{
						message: 'Invalid symbol value',
						path: [0, 'value', rawKey, wrappedKey],
					},
				],
			});
	});

	it('exposes composed results as Standard Schema', async () => {
		const step = new StringToNumberValSan();
		const valsan = new ComposedValSan<string, number>([
			new TrimSanitizer(), step,
		]);

		expect(valsan['~standard'].version).toBe(1);
		expect(valsan['~standard'].vendor).toBe('valsan');
		expect(await valsan['~standard'].validate(' 42 '))
			.toEqual({ value: 42 });
		expect(await valsan['~standard'].validate('invalid')).toEqual({
			issues: [{ message: step.rules().number.user.errorMessage }],
		});
	});

	for (const input of [null, undefined]) {
		it(`preserves optional ${input} with sound types`, async () => {
			const step = new StringToNumberValSan({ isOptional: true });
			const composed = new ComposedValSan<string, number>(
				[step], { isOptional: true }
			);
			type StepOutput = StandardSchemaV1.InferOutput<typeof step>;
			type ComposedOutput =
				StandardSchemaV1.InferOutput<typeof composed>;
			type Equal<A, B> =
				(<T>() => T extends A ? 1 : 2) extends
				(<T>() => T extends B ? 1 : 2) ? true : false;
			const stepTypeIsSound:
				Equal<StepOutput, number | null | undefined> = true;
			const composedTypeIsSound:
				Equal<ComposedOutput, number | null | undefined> = true;
			const output: StepOutput = input;
			const composedOutput: ComposedOutput = input;

			expect(stepTypeIsSound).toBe(true);
			expect(composedTypeIsSound).toBe(true);
			expect(await step['~standard'].validate(input))
				.toEqual({ value: output });
			expect(await composed['~standard'].validate(input))
				.toEqual({ value: composedOutput });
			const required = new ComposedValSan<string, number>([step]);
			expect(await required['~standard'].validate(input)).toEqual({
				issues: [{ message: 'Value is required' }],
			});
		});
	}

	it('accepts callable schemas in nested objects and arrays', async () => {
		const callable = Object.assign(
			(value: string) => value.trim(),
			trimmedStringSchema
		);
		const valsan = new ObjectValSan({
			schema: {
				name: callable,
				names: new ArrayValSan({ schema: callable }),
			},
		});

		expect(await valsan.run({
			name: ' alice ', names: [' bob '],
		})).toEqual({
			success: true,
			data: { name: 'alice', names: ['bob'] },
			errors: [],
		});
		const result = await valsan.run({ name: 42, names: [false] });
		expect(result.errors.map((error) => error.path))
			.toEqual([['name'], ['names', 0]]);
	});

	const malformedIssues: unknown[] = [
		null,
		undefined,
		42,
		[],
		{},
		{ message: 42 },
		{ message: 'invalid', path: null },
		{ message: 'invalid', path: 'name' },
		{ message: 'invalid', path: [null] },
		{ message: 'invalid', path: [undefined] },
		{ message: 'invalid', path: [true] },
		{ message: 'invalid', path: [{}] },
		{ message: 'invalid', path: [{ key: null }] },
		{ message: 'invalid', path: [{ key: {} }] },
		{ message: 'invalid', path: new Array(1) },
	];
	for (const issue of malformedIssues) {
		it(`rejects malformed issue ${JSON.stringify(issue)}`, async () => {
			const schema: unknown = {
				'~standard': {
					version: 1,
					vendor: 'test',
					validate: () => ({ issues: [issue] }),
				},
			};

			await expectAsync(runSchema(schema as SchemaLike, 'value'))
				.toBeRejectedWithError(
					TypeError, 'Invalid Standard Schema validation result'
				);
		});
	}

	it('preserves multiple issues and supported path segments', async () => {
		const schema: StandardSchemaV1 = {
			'~standard': {
				version: 1,
				vendor: 'test',
				validate: () => ({
					issues: [
						{ message: '', path: undefined },
						{ message: 'Root issue', path: [] },
						{
							message: 'Nested issue',
							path: ['name', { key: 'list' }, { key: 0 }],
						},
					],
				}),
			},
		};

		expect(await runSchema(schema, 'value')).toEqual({
			success: false,
			errors: [
				{ code: 'standard_schema', message: '' },
				{ code: 'standard_schema', message: 'Root issue', path: [] },
				{
					code: 'standard_schema',
					message: 'Nested issue',
					path: ['name', 'list', 0],
				},
			],
		});
	});
});
