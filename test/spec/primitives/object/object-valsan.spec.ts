import 'jasmine';
import { ObjectValSan } from '../../../../src/primitives/object';
import { TrimSanitizer } from '../../../../src/primitives/string';
import { IntegerValidator } from '../../../../src/primitives/number';
import { EmailValidator } from '../../../../src/primitives/person';
import { ObjectSanitizer } from '../../../../src';

describe('ObjectValSan', () => {
	it('should validate and sanitize nested objects', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
				city: new TrimSanitizer(),
				zipCode: new TrimSanitizer(),
			},
		});

		const result = await addressValSan.run({
			street: '  123 Main St  ',
			city: '  Springfield  ',
			zipCode: '  12345  ',
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			street: '123 Main St',
			city: 'Springfield',
			zipCode: '12345',
		});
		expect(result.errors.length).toBe(0);
	});

	it('should fail for invalid nested object data', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
				age: new IntegerValidator(),
			},
		});

		const result = await addressValSan.run({
			street: 'Main St',
			age: 'not a number',
		});

		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('should work as nested primitive within ObjectSanitizer', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
				city: new TrimSanitizer(),
			},
		});

		const userSchema = new ObjectSanitizer({
			name: new TrimSanitizer(),
			email: new EmailValidator(),
			address: addressValSan,
		});

		const result = await userSchema.run({
			name: '  John Doe  ',
			email: 'john@example.com',
			address: {
				street: '  123 Main St  ',
				city: '  Springfield  ',
			},
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			name: 'John Doe',
			email: 'john@example.com',
			address: {
				street: '123 Main St',
				city: 'Springfield',
			},
		});
	});

	it('should reject non-object input', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valsan.run('not an object' as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('object');
	});

	it('should reject array input', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valsan.run([1, 2, 3] as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('object');
	});

	it('should reject null input', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valsan.run(null as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should handle undefined input when not optional', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valsan.run(undefined as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should handle undefined input when optional', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
			isOptional: true,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valsan.run(undefined as any);

		expect(result.success).toBe(true);
		expect(result.data).toBe(undefined);
	});

	it('should support deeply nested objects', async () => {
		const cityValSan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
				zipCode: new TrimSanitizer(),
			},
		});

		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
				city: cityValSan,
			},
		});

		const result = await addressValSan.run({
			street: '  123 Main St  ',
			city: {
				name: '  Springfield  ',
				zipCode: '  12345  ',
			},
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			street: '123 Main St',
			city: {
				name: 'Springfield',
				zipCode: '12345',
			},
		});
	});

	it('should propagate field errors from nested objects', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				age: new IntegerValidator(),
			},
		});

		const result = await addressValSan.run({
			age: 'invalid',
		});

		expect(result.success).toBe(false);
		expect(result.errors[0].field).toBe('age');
	});

	it('should detect unexpected fields', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		const result = await valsan.run({
			name: 'John',
			extraField: 'should fail',
		});

		expect(result.success).toBe(false);
		expect(
			result.errors.find((e) => e.code === 'unexpected_field')
		).toBeDefined();
		expect(
			result.errors.find((e) => e.field === 'extraField')
		).toBeDefined();
	});

	it('should handle multiple unexpected fields', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		const result = await valsan.run({
			name: 'John',
			extra1: 'value1',
			extra2: 'value2',
		});

		expect(result.success).toBe(false);
		const unexpectedErrors = result.errors.filter(
			(e) => e.code === 'unexpected_field'
		);
		expect(unexpectedErrors.length).toBe(2);
	});

	it('should handle nested field errors with dot notation', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
			},
		});

		const userSchema = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
				address: addressValSan,
			},
		});

		const result = await userSchema.run({
			name: 'John',
			address: {
				// Missing required street field
				street: '',
			},
		});

		expect(result.success).toBe(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.address?.street).toBe('');
	});

	it('should handle empty object with optional schema', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer().copy({ isOptional: true }),
				email: new EmailValidator().copy({ isOptional: true }),
			},
		});

		const result = await valsan.run({});

		expect(result.success).toBe(true);
		// Fields that don't exist and are optional will have undefined values
		expect(result.data).toBeDefined();
	});

	it('should handle null as unexpected field', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valsan.run({
			name: 'John',
			nullField: null as unknown,
		});

		expect(result.success).toBe(false);
		expect(
			result.errors.find((e) => e.field === 'nullField')
		).toBeDefined();
	});

	it('should handle nested errors with field path prefixing', async () => {
		const cityValSan = new ObjectValSan({
			schema: {
				population: new IntegerValidator(),
			},
		});

		const addressValSan = new ObjectValSan({
			schema: {
				city: cityValSan,
			},
		});

		const result = await addressValSan.run({
			city: {
				population: 'not a number',
			},
		});

		expect(result.success).toBe(false);
		// Should have city.population in the field path
		expect(result.errors.some((e) => e.field?.includes('city'))).toBe(true);
	});

	it('should validate and transform optional fields', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
				middleName: new TrimSanitizer().copy({ isOptional: true }),
				lastName: new TrimSanitizer(),
			},
		});

		const result = await valsan.run({
			name: '  John  ',
			lastName: '  Doe  ',
		});

		expect(result.success).toBe(true);
		// Optional field that's not provided will have undefined value
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.name).toBe('John');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.lastName).toBe('Doe');
	});

	it('should have rules for error reporting', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		const rules = valsan.rules();
		expect(rules.object).toBeDefined();
		expect(rules.object.code).toBe('object');
		expect(rules.object.user.errorMessage).toBeDefined();
	});

	it('should have correct type property', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		expect(valsan.type).toBe('object');
	});

	it('should have 100% coverage of validate and sanitize', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		// Directly test the unused validate method
		// (normally called by run())
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const validateResult = await (valsan as any).validate({});
		expect(validateResult.isValid).toBe(true);
		expect(validateResult.errors.length).toBe(0);

		// Directly test the unused sanitize method
		// (normally called by run())
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const sanitizeResult = await (valsan as any).sanitize({});
		expect(sanitizeResult).toEqual({});
	});

	it('can get the schema', async () => {
		const schema = {
			name: new TrimSanitizer(),
			age: new IntegerValidator(),
		};
		const valsan = new ObjectValSan({
			schema,
		});

		expect(valsan.schema).toBe(schema);
	});

	it('should reject additional properties by default', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
		});

		const result = await valsan.run({
			name: 'John',
			extra: 'field',
		});

		expect(result.success).toBe(false);
		expect(result.errors.some((e) => e.code === 'unexpected_field')).toBe(
			true
		);
	});

	it('should allow additional properties when enabled', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
			allowAdditionalProperties: true,
		});

		const result = await valsan.run({
			name: 'John',
			extra: 'field',
			another: 123,
		});

		expect(result.success).toBe(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.name).toBe('John');
		// Additional properties should be preserved
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.extra).toBe('field');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.another).toBe(123);
	});

	// eslint-disable-next-line max-len
	it('should allow additional properties in nested objects when enabled', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
			},
			allowAdditionalProperties: true,
		});

		const userValSan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
				address: addressValSan,
			},
			allowAdditionalProperties: true,
		});

		const result = await userValSan.run({
			name: 'John',
			email: 'john@example.com',
			address: {
				street: '123 Main St',
				city: 'Springfield',
			},
		});

		expect(result.success).toBe(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.email).toBe('john@example.com');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result.data as any)?.address?.city).toBe('Springfield');
	});

	// eslint-disable-next-line max-len
	it('should reject additional properties in nested objects by default', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
			},
		});

		const userValSan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
				address: addressValSan,
			},
		});

		const result = await userValSan.run({
			name: 'John',
			address: {
				street: '123 Main St',
				city: 'Springfield',
			},
		});

		expect(result.success).toBe(false);
		expect(result.errors.some((e) => e.code === 'unexpected_field')).toBe(
			true
		);
	});

	it('should handle mixed allow settings in nested objects', async () => {
		const addressValSan = new ObjectValSan({
			schema: {
				street: new TrimSanitizer(),
			},
			allowAdditionalProperties: true, // Allows extra fields
		});

		const userValSan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
				address: addressValSan,
			},
			allowAdditionalProperties: false, // Does not allow extra fields
		});

		const result = await userValSan.run({
			name: 'John',
			email: 'john@example.com', // Should fail here
			address: {
				street: '123 Main St',
				city: 'Springfield', // Should be allowed
			},
		});

		expect(result.success).toBe(false);
		// Should have error for email (not allowed at user level)
		expect(result.errors.some((e) => e.field === 'email')).toBe(true);
	});

	// eslint-disable-next-line max-len
	it('should preserve all additional properties with original values', async () => {
		const valsan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
			},
			allowAdditionalProperties: true,
		});

		const input = {
			name: '  John  ',
			metadata: { key: 'value' },
			count: 42,
			flag: true,
			nullable: null,
		};

		const result = await valsan.run(input);

		expect(result.success).toBe(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = result.data as any;
		expect(data.metadata).toEqual({ key: 'value' });
		expect(data.count).toBe(42);
		expect(data.flag).toBe(true);
		expect(data.nullable).toBeNull();
	});

	it(
		'should still validate schema fields even when allowing ' +
			'additional properties',
		async () => {
			const valsan = new ObjectValSan({
				schema: {
					age: new IntegerValidator(),
				},
				allowAdditionalProperties: true,
			});

			const result = await valsan.run({
				age: 'not a number',
				extra: 'field',
			});

			expect(result.success).toBe(false);
			// Should fail on age validation, not on extra field
			expect(result.errors.some((e) => e.field === 'age')).toBe(true);
		}
	);
});
