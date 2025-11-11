import { UrlValSan } from '../../../../src/primitives/network/url-valsan';

describe('UrlValSan', () => {
	const valSan = new UrlValSan();

	it('accepts valid URL', async () => {
		const result = await valSan.run('https://example.com');
		expect(result.success).toBe(true);
	});

	it('rejects invalid URL', async () => {
		const result = await valSan.run('not a url');
		expect(result.success).toBe(false);
	});

	it('trims whitespace in sanitize', async () => {
		const result = await valSan.run('  https://example.com  ');
		expect(result.success).toBe(true);
		expect(result.data).toBe('https://example.com');
	});

	it('rejects empty string', async () => {
		const result = await valSan.run('');
		expect(result.success).toBe(false);
	});

	it('rejects undefined input', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valSan.run(undefined as any);
		expect(result.success).toBe(false);
	});

	it('rejects URL missing protocol', async () => {
		const result = await valSan.run('example.com');
		expect(result.success).toBe(false);
	});

	it('rejects URL with spaces', async () => {
		const result = await valSan.run('https://exa mple.com');
		expect(result.success).toBe(false);
	});
});
