import { FqdnValSan } from '../../../../src/primitives/network/fqdn-valsan';

describe('FqdnValSan', () => {
	const valSan = new FqdnValSan();
	it('accepts valid FQDN', async () => {
		const result = await valSan.run('sub.example.com');
		expect(result.success).toBe(true);
	});
	it('rejects invalid FQDN', async () => {
		const result = await valSan.run('invalid_domain');
		expect(result.success).toBe(false);
	});

	it('trims whitespace in sanitize', async () => {
		const result = await valSan.run('  sub.example.com  ');
		expect(result.success).toBe(true);
		expect(result.data).toBe('sub.example.com');
	});

	it('rejects empty string', async () => {
		const result = await valSan.run('');
		expect(result.success).toBe(false);
	});

	it('rejects FQDN with label > 63 chars', async () => {
		const longLabel = 'a'.repeat(64) + '.example.com';
		const result = await valSan.run(longLabel);
		expect(result.success).toBe(false);
	});

	it('accepts FQDN with max 63-char label', async () => {
		const label = 'a'.repeat(63);
		const fqdn = `${label}.com`;
		const result = await valSan.run(fqdn);
		expect(result.success).toBe(true);
	});

	it('rejects FQDN with total length > 255', async () => {
		const label = 'a'.repeat(63);
		const fqdn = Array(5).fill(label).join('.') + '.com';
		const result = await valSan.run(fqdn);
		expect(result.success).toBe(false);
	});

	it('accepts FQDN with hyphens in label', async () => {
		const result = await valSan.run('my-label.example.com');
		expect(result.success).toBe(true);
	});

	it('rejects FQDN with label starting with hyphen', async () => {
		const result = await valSan.run('-label.example.com');
		expect(result.success).toBe(false);
	});

	it('rejects FQDN with label ending with hyphen', async () => {
		const result = await valSan.run('label-.example.com');
		expect(result.success).toBe(false);
	});
});
