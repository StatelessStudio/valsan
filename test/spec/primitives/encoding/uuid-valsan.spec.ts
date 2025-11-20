import { UuidValSan } from '../../../../src/primitives';

describe('UuidValSan', () => {
	const validUuidV4 = '550e8400-e29b-41d4-a716-446655440000';
	const validUuidV4Upper = '550E8400-E29B-41D4-A716-446655440000';
	const validUuidV4Mixed = '550e8400-E29b-41D4-a716-446655440000';
	const validUuidV1 = '550e8400-e29b-11d4-a716-446655440000';
	const validUuidV3 = '550e8400-e29b-31d4-a716-446655440000';
	const validUuidV5 = '550e8400-e29b-51d4-a716-446655440000';

	it('accepts a valid UUID v4', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(validUuidV4);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validUuidV4);
	});

	it('accepts UUID with uppercase letters', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(validUuidV4Upper);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validUuidV4);
	});

	it('accepts UUID with mixed case', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(validUuidV4Mixed);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validUuidV4);
	});

	it('normalizes by trimming whitespace', async () => {
		const validator = new UuidValSan();
		const input = `  ${validUuidV4}  `;
		const result = await validator.run(input);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validUuidV4);
	});

	it('rejects empty string', async () => {
		const validator = new UuidValSan();
		const result = await validator.run('');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('uuid');
	});

	it('rejects UUID without hyphens', async () => {
		const validator = new UuidValSan();
		const result = await validator.run('550e8400e29b41d4a716446655440000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('uuid');
	});

	it('rejects UUID with wrong segment lengths', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(
			'550e8400-e29b-41d4-a716-4466554400'
		);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('uuid');
	});

	it('rejects UUID with invalid characters', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(
			'550e8400-e29b-41d4-a716-44665544000g'
		);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('uuid');
	});

	it('rejects non-string input', async () => {
		const validator = new UuidValSan();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(null as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('rejects number input', async () => {
		const validator = new UuidValSan();
		const num: unknown = 123456;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(num as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('rejects array input', async () => {
		const validator = new UuidValSan();
		const arr: unknown = [validUuidV4];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(arr as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('rejects object input', async () => {
		const validator = new UuidValSan();
		const obj: unknown = { uuid: validUuidV4 };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(obj as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('accepts valid UUID v1', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(validUuidV1);
		expect(result.success).toBe(true);
	});

	it('accepts valid UUID v3', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(validUuidV3);
		expect(result.success).toBe(true);
	});

	it('accepts valid UUID v5', async () => {
		const validator = new UuidValSan();
		const result = await validator.run(validUuidV5);
		expect(result.success).toBe(true);
	});
});
