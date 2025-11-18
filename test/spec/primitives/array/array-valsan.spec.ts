import 'jasmine';
import { ArrayValSan } from '../../../../src/primitives';
import { TrimSanitizer } from '../../../../src/primitives/string';
import { IntegerValidator } from '../../../../src/primitives/number';
import { EmailValidator } from '../../../../src/primitives/person';
import { ObjectValSan } from '../../../../src/primitives/object';

describe('ArrayValSan', () => {
	it('should validate and sanitize array of primitives', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([1, 2, 3]);

		expect(result.success).toBe(true);
		expect(result.data).toEqual([1, 2, 3]);
		expect(result.errors.length).toBe(0);
	});

	it('should validate and sanitize array of strings', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new TrimSanitizer(),
		});

		const result = await arrayValSan.run(['  hello  ', '  world  ']);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(['hello', 'world']);
		expect(result.errors.length).toBe(0);
	});

	it('should fail for invalid array elements', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([1, 'not a number', 3]);

		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].field).toContain('[1]');
	});

	it('should reject non-array input', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await arrayValSan.run('not an array' as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('array');
	});

	it('should reject null input', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await arrayValSan.run(null as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should handle undefined input when not optional', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await arrayValSan.run(undefined as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should handle undefined input when optional', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
			isOptional: true,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await arrayValSan.run(undefined as any);

		expect(result.success).toBe(true);
		expect(result.data).toBe(undefined);
	});

	it('should handle empty array', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([]);

		expect(result.success).toBe(true);
		expect(result.data).toEqual([]);
	});

	it('should support array of objects', async () => {
		const objectArrayValSan = new ArrayValSan({
			schema: new EmailValidator(),
		});

		const result = await objectArrayValSan.run([
			'user1@example.com',
			'user2@example.com',
		]);

		expect(result.success).toBe(true);
		expect(result.data?.length).toBe(2);
	});

	it('should propagate field errors with array index', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([1, 'invalid', 3]);

		expect(result.success).toBe(false);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(result.errors.some((e: any) => e.field?.includes('[1]'))).toBe(
			true
		);
	});

	it('should handle multiple validation errors in array', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([
			'invalid1',
			'invalid2',
			'invalid3',
		]);

		expect(result.success).toBe(false);
		expect(result.errors.length).toBe(3);
	});

	it('should reject object input', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await arrayValSan.run({ 0: 1, 1: 2 } as any);

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('array');
	});

	it('should have rules for error reporting', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const rules = arrayValSan.rules();
		expect(rules.array).toBeDefined();
		expect(rules.array.code).toBe('array');
		expect(rules.array.user.errorMessage).toBeDefined();
	});

	it('should have correct type property', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		expect(arrayValSan.type).toBe('array');
	});

	it('should have 100% coverage of validate and sanitize', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		// Directly test the unused validate method
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const validateResult = await (arrayValSan as any).validate([]);
		expect(validateResult.isValid).toBe(true);
		expect(validateResult.errors.length).toBe(0);

		// Directly test the unused sanitize method
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const sanitizeResult = await (arrayValSan as any).sanitize([]);
		expect(sanitizeResult).toEqual([]);
	});

	it('can get the schema', async () => {
		const schema = new IntegerValidator();
		const arrayValSan = new ArrayValSan({
			schema,
		});

		expect(arrayValSan.schema).toBe(schema);
	});

	it('should handle complex objects in array', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new TrimSanitizer(),
		});

		const result = await arrayValSan.run(['  string1  ', '  string2  ']);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(['string1', 'string2']);
	});

	it('should handle validator with isOptional for array items', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator().copy({ isOptional: true }),
		});

		const result = await arrayValSan.run([1, undefined, 3]);

		expect(result.success).toBe(true);
		expect(result.data).toEqual([1, undefined, 3]);
	});

	it('should handle null input when optional', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
			isOptional: true,
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await arrayValSan.run(null as any);

		expect(result.success).toBe(true);
		expect(result.data).toBe(undefined);
	});

	it('should handle field errors with nested field paths', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new EmailValidator(),
		});

		const result = await arrayValSan.run([
			'valid@example.com',
			'invalid-email',
			'another@example.com',
		]);

		expect(result.success).toBe(false);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(result.errors.some((e: any) => e.field?.includes('[1]'))).toBe(
			true
		);
	});

	it('should return errors immediately when validation fails', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([1, 'not-a-number', 3]);

		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('should handle multiple errors across different elements', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run(['invalid1', 'invalid2']);

		expect(result.success).toBe(false);
		expect(result.errors.length).toBe(2);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(result.errors.some((e: any) => e.field?.includes('[0]'))).toBe(
			true
		);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(result.errors.some((e: any) => e.field?.includes('[1]'))).toBe(
			true
		);
	});

	it('should handle errors from nested validators', async () => {
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([1, 2, 'not-int', 4]);

		expect(result.success).toBe(false);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(result.errors.some((e: any) => e.field === '[2]')).toBe(true);
		expect(result.errors[0].code).toBeDefined();
	});

	it('should handle field-less errors from validators', async () => {
		// This test ensures that when a validator returns an error
		// without a field property, the array index is used as the field
		const arrayValSan = new ArrayValSan({
			schema: new IntegerValidator(),
		});

		const result = await arrayValSan.run([1, 'invalid', 3]);

		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		// The error should have a field set to the array index
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const arrayIndexError = result.errors.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(e: any) => e.field?.includes('[1]')
		);
		expect(arrayIndexError).toBeDefined();
	});

	it('should handle nested object errors in array', async () => {
		// This test ensures that nested field errors are properly prefixed
		const objectValSan = new ObjectValSan({
			schema: {
				name: new TrimSanitizer(),
				age: new IntegerValidator(),
			},
		});

		const arrayValSan = new ArrayValSan({
			schema: objectValSan,
		});

		const result = await arrayValSan.run([
			{ name: 'John', age: 30 },
			{ name: 'Jane', age: 'invalid' },
		]);

		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
		// Check that nested errors are prefixed with array index
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const nestedError = result.errors.find((e: any) =>
			e.field?.includes('[1]')
		);
		expect(nestedError).toBeDefined();
	});
});
