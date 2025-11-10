// eslint-disable-next-line max-len
import { BearerTokenValSan } from '../../../../src/primitives';

describe('BearerTokenValSan', () => {
	it('accepts a valid bearer token', async () => {
		const validator = new BearerTokenValSan();
		const result = await validator.run('Bearer mF_9.B5f-4.1JqM');
		expect(result.success).toBe(true);
		expect(result.data).toBe('mF_9.B5f-4.1JqM');
	});

	it('rejects empty string', async () => {
		const validator = new BearerTokenValSan();
		const result = await validator.run('');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_BEARER_TOKEN');
	});

	it('rejects string with spaces', async () => {
		const validator = new BearerTokenValSan();
		const result = await validator.run('Bearer abc 123');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_BEARER_TOKEN');
	});

	it('rejects non-string input', async () => {
		const validator = new BearerTokenValSan();
		const result = await validator.run(undefined);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_BEARER_TOKEN');
	});

	it('rejects string without Bearer prefix', async () => {
		const validator = new BearerTokenValSan();
		const result = await validator.run('mF_9.B5f-4.1JqM');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_BEARER_TOKEN');
	});

	it('rejects string with only Bearer prefix', async () => {
		const validator = new BearerTokenValSan();
		const result = await validator.run('Bearer ');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_BEARER_TOKEN');
	});

	it('sanitizes by removing Bearer prefix', async () => {
		const validator = new BearerTokenValSan();
		const result = await validator.run('Bearer   mF_9.B5f-4.1JqM   ');
		expect(result.success).toBe(true);
		expect(result.data).toBe('mF_9.B5f-4.1JqM');
	});
});
