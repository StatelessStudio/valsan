import { Iso8601TimestampValSan } from '../../../../src/primitives';

describe('Iso8601TimestampValSan', () => {
	const valSan = new Iso8601TimestampValSan();

	it('should validate a correct ISO 8601 timestamp', async () => {
		const result = await valSan.run('2025-11-09T12:34:56Z');
		expect(result.success).toBe(true);
		expect(result.data).toBeInstanceOf(Date);
		expect(result.data?.toISOString()).toBe('2025-11-09T12:34:56.000Z');
	});

	it('supports ISO 8601 with milliseconds', async () => {
		const iso = '2025-11-09T12:34:56.789Z';
		const result = await valSan.run(iso);
		expect(result.success).toBe(true);
		expect(result.data).toBeInstanceOf(Date);
		expect(result.data?.toISOString()).toBe(iso);
	});

	it('should fail for an invalid ISO 8601 timestamp', async () => {
		const result = await valSan.run('not-a-timestamp');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('iso8601');
	});

	it('should fail for undefined input', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valSan.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string_or_date');
	});

	it('should sanitize a Date to Date', async () => {
		const date = new Date('2025-11-09T12:34:56Z');
		const result = await valSan.run(date);
		expect(result.success).toBe(true);
		expect(result.data).toBeInstanceOf(Date);
		expect(result.data?.toISOString()).toBe(date.toISOString());
	});

	it('should pass through a valid ISO 8601 string', async () => {
		const iso = '2025-11-09T12:34:56Z';
		const result = await valSan.run(iso);
		expect(result.success).toBe(true);
		expect(result.data).toBeInstanceOf(Date);
		expect(result.data?.toISOString()).toBe('2025-11-09T12:34:56.000Z');
	});

	it('should fail for an invalid string', async () => {
		const result = await valSan.run('not-a-timestamp');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('iso8601');
	});
});
