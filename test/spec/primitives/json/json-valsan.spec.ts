import { JsonValSan } from '../../../../src/primitives';

describe('JsonValSan', () => {
	const validJsonObject = '{"key": "value"}';
	const validJsonArray = '[1, 2, 3]';
	const validJsonString = '"hello"';
	const validJsonNumber = '42';
	const validJsonBoolean = 'true';
	const validJsonNull = 'null';
	const validJsonComplex = '{"users": [{"id": 1, "name": "John"}]}';

	it('accepts valid JSON object', async () => {
		const validator = new JsonValSan();
		const result = await validator.run(validJsonObject);
		expect(result.success).toBe(true);
		expect(typeof result.data).toBe('object');
		expect(result.data).toEqual({ key: 'value' });
	});

	it('accepts valid JSON array', async () => {
		const validator = new JsonValSan();
		const result = await validator.run(validJsonArray);
		expect(result.success).toBe(true);
		expect(Array.isArray(result.data)).toBe(true);
		expect(result.data).toEqual([1, 2, 3]);
	});

	it('accepts valid JSON string', async () => {
		const validator = new JsonValSan();
		const result = await validator.run(validJsonString);
		expect(result.success).toBe(true);
		expect(result.data).toBe('hello');
	});

	it('accepts valid JSON number', async () => {
		const validator = new JsonValSan();
		const result = await validator.run(validJsonNumber);
		expect(result.success).toBe(true);
		expect(result.data).toBe(42);
	});

	it('accepts valid JSON boolean', async () => {
		const validator = new JsonValSan();
		const result = await validator.run(validJsonBoolean);
		expect(result.success).toBe(true);
		expect(result.data).toBe(true);
	});

	it('accepts valid JSON null', async () => {
		const validator = new JsonValSan();
		const result = await validator.run(validJsonNull);
		expect(result.success).toBe(true);
		expect(result.data).toBe(null);
	});

	it('accepts complex nested JSON', async () => {
		const validator = new JsonValSan();
		const result = await validator.run(validJsonComplex);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			users: [{ id: 1, name: 'John' }],
		});
	});

	it('normalizes by trimming whitespace', async () => {
		const validator = new JsonValSan();
		const input = `  ${validJsonObject}  `;
		const result = await validator.run(input);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ key: 'value' });
	});

	it('rejects empty string', async () => {
		const validator = new JsonValSan();
		const result = await validator.run('');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('json');
	});

	it('rejects malformed JSON object', async () => {
		const validator = new JsonValSan();
		const result = await validator.run('{"key": "value"');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('json');
	});

	it('rejects invalid JSON with trailing comma', async () => {
		const validator = new JsonValSan();
		const result = await validator.run('{"key": "value",}');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('json');
	});

	it('rejects unquoted JSON keys', async () => {
		const validator = new JsonValSan();
		const result = await validator.run('{key: "value"}');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('json');
	});

	it('rejects single quotes in JSON', async () => {
		const validator = new JsonValSan();
		const input = '{\'key\': \'value\'}';
		const result = await validator.run(input);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('json');
	});

	it('rejects non-string input', async () => {
		const validator = new JsonValSan();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(null as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('rejects number input', async () => {
		const validator = new JsonValSan();
		const num: unknown = 123;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(num as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('rejects object input', async () => {
		const validator = new JsonValSan();
		const obj: unknown = { key: 'value' };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(obj as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('rejects array input', async () => {
		const validator = new JsonValSan();
		const arr: unknown = [1, 2, 3];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(arr as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('handles deeply nested JSON', async () => {
		const validator = new JsonValSan();
		const deepJson = '{"a":{"b":{"c":{"d":{"e":{"f":"value"}}}}}}';
		const result = await validator.run(deepJson);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({
			a: { b: { c: { d: { e: { f: 'value' } } } } },
		});
	});

	it('handles JSON with special characters', async () => {
		const validator = new JsonValSan();
		const input = '{"text":"hello\\nworld\\t!"}';
		const result = await validator.run(input);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ text: 'hello\nworld\t!' });
	});

	it('handles JSON with unicode characters', async () => {
		const validator = new JsonValSan();
		const input = '{"greeting":"你好"}';
		const result = await validator.run(input);
		expect(result.success).toBe(true);
		expect(result.data).toEqual({ greeting: '你好' });
	});
});
