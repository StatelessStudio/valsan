import 'jasmine';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
	ArrayValSan,
	EnumValidator,
	LengthValidator,
	ObjectValSan,
	SchemaInput,
	SchemaOutput,
	SchemaValue,
	StringToNumberValSan,
	TrimSanitizer,
	ValSanOptions,
} from '../../../src';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends
	(<T>() => T extends B ? 1 : 2) ? true : false;

describe('Schema type inference', () => {
	it('infers the workflow field as a required string', async () => {
		const schema = new ObjectValSan({
			schema: {
				exampleField: new LengthValidator({
					minLength: 0, maxLength: 255,
				}),
			},
		});
		type Output = StandardSchemaV1.InferOutput<typeof schema>;
		const execute = (inputData: Output) => {
			const { exampleField } = inputData;
			const field: string = exampleField;
			// @ts-expect-error Unknown fields are not declared on the object.
			inputData.missingField;
			return { exampleField: field };
		};
		const result = await schema['~standard'].validate({
			exampleField: 'hello',
		});
		if ('issues' in result) {
			fail('Expected successful validation');
			return;
		}
		expect(execute(result.value)).toEqual({ exampleField: 'hello' });
		// @ts-expect-error Required container output excludes null.
		const invalid: Output = null;
		expect(invalid).toBeNull();
	});

	it('infers nested inputs, transformed outputs, and array elements',
		async () => {
			const foreign: StandardSchemaV1<string, number> = {
				'~standard': {
					version: 1, vendor: 'test',
					validate: (value) => typeof value === 'string'
						? { value: value.length }
						: { issues: [{ message: 'Expected a string' }] },
				},
			};
			const schema = new ObjectValSan({
				schema: {
					count: new StringToNumberValSan(),
					rows: new ArrayValSan({
						schema: new ObjectValSan({
							schema: { size: foreign },
						}),
					}),
				},
			});
			type Input = SchemaInput<typeof schema>;
			type Output = SchemaOutput<typeof schema>;
			const input: Input = {
				count: '42', rows: [{ size: 'abc' }],
			};
			const output: Output = {
				count: 42, rows: [{ size: 3 }],
			};
			const countIsNumber: Equal<Output['count'], number> = true;
			const sizeIsNumber:
				Equal<Output['rows'][number]['size'], number> = true;
			expect(countIsNumber && sizeIsNumber).toBe(true);
			// @ts-expect-error Transformed input remains a string.
			const wrongInput: Input['count'] = 42;
			// @ts-expect-error Transformed output is a number.
			const wrongOutput: Output['rows'][number]['size'] = 'abc';
			expect(wrongInput).toBeDefined();
			expect(wrongOutput).toBeDefined();
			const result = await schema.run(input);
			expect(result.data).toEqual(output);
		});

	it('infers optional keys and nullable values independently', async () => {
		const schema = new ObjectValSan({
			schema: {
				required: new TrimSanitizer(),
				optional: new TrimSanitizer({ isOptional: true }),
				nullable: new TrimSanitizer({ isNullable: true }),
				undefinable: new TrimSanitizer({ isUndefinable: true }),
				overridden: new TrimSanitizer({
					isOptional: true, isNullable: false, isUndefinable: false,
				}),
			},
		});
		type Output = SchemaOutput<typeof schema>;
		type Input = SchemaInput<typeof schema>;
		const output: Output = {
			required: 'a', nullable: null, overridden: 'b',
		};
		const input: Input = output;
		const optionalIsSound:
			Equal<Output['optional'], string | null | undefined> = true;
		const nullableIsSound:
			Equal<Output['nullable'], string | null> = true;
		const undefinableIsSound:
			Equal<Output['undefinable'], string | undefined> = true;
		const overriddenIsRequired:
			Equal<Output['overridden'], string> = true;
		expect(optionalIsSound && nullableIsSound && undefinableIsSound &&
			overriddenIsRequired).toBe(true);
		// @ts-expect-error Nullable keys are still required.
		const missing: Output = { required: 'a', overridden: 'b' };
		expect(missing).toBeDefined();
		expect((await schema.run(input)).success).toBe(true);
	});

	it('infers nullish container options and conservative boolean options',
		async () => {
			const required = new ArrayValSan({ schema: new TrimSanitizer() });
			const optional = new ArrayValSan({
				schema: new TrimSanitizer(), isOptional: true,
			});
			const nullable = new ObjectValSan({
				schema: { value: new TrimSanitizer() }, isNullable: true,
			});
			const undefinable = new ObjectValSan({
				schema: { value: new TrimSanitizer() }, isUndefinable: true,
			});
			const overridden = new ArrayValSan({
				schema: new TrimSanitizer(), isOptional: true,
				isNullable: false, isUndefinable: false,
			});
			const requiredIsSound:
				Equal<SchemaOutput<typeof required>, string[]> = true;
			const optionalIsSound:
				Equal<SchemaOutput<typeof optional>,
					string[] | null | undefined> = true;
			const overriddenIsSound:
				Equal<SchemaOutput<typeof overridden>, string[]> = true;
			const nullableValue: SchemaOutput<typeof nullable> = null;
			const undefinableValue:
				SchemaOutput<typeof undefinable> = undefined;
			const broadIsSound:
				Equal<SchemaValue<string, ValSanOptions>,
					string | null | undefined> = true;
			const precedenceIsSound:
				Equal<SchemaValue<string, {
					isOptional: true; isNullable: boolean;
					isUndefinable: false;
				}>, string | null> = true;
			const unionIsSound:
				Equal<SchemaValue<string, { isNullable: true } |
					Record<string, never>>, string | null> = true;
			expect(requiredIsSound && optionalIsSound && overriddenIsSound &&
				broadIsSound && precedenceIsSound && unionIsSound).toBe(true);
			expect((await nullable.run(nullableValue)).data).toBeNull();
			expect((await undefinable.run(undefinableValue)).data)
				.toBeUndefined();
		});

	it('retains optional foreign output and allowed additional fields', () => {
		const foreign: StandardSchemaV1<
			string | undefined, number | undefined
		> = {
			'~standard': {
				version: 1, vendor: 'test',
				validate: () => ({ value: undefined }),
			},
		};
		const schema = new ObjectValSan({
			schema: { value: foreign }, allowAdditionalProperties: true,
		});
		const output: SchemaOutput<typeof schema> = { extra: 'preserved' };
		const input: SchemaInput<typeof schema> = {};
		expect(output['extra']).toBe('preserved');
		expect(input).toEqual({});
		const knownFieldIsSound:
			Equal<SchemaOutput<typeof schema>['value'],
				number | undefined> = true;
		expect(knownFieldIsSound).toBe(true);
	});

	it('retains enum value inference while resolving optionality', () => {
		const required = new EnumValidator({ allowedValues: ['one', 'two'] });
		const optional = new EnumValidator({
			allowedValues: [1, 2], isNullable: true,
		});
		const stringIsSound:
			Equal<SchemaOutput<typeof required>, 'one' | 'two'> = true;
		const numberIsSound:
			Equal<SchemaOutput<typeof optional>, 1 | 2 | null> = true;
		expect(stringIsSound && numberIsSound).toBe(true);
	});

	it('does not widen constructor options through contextual typing', () => {
		const trim: TrimSanitizer = new TrimSanitizer();
		const requiredIsSound:
			Equal<SchemaOutput<typeof trim>, string> = true;
		expect(requiredIsSound).toBe(true);
	});
});
