// eslint-disable-next-line max-len
import { IpAddressValSan } from '../../../../src/primitives';

describe('IpAddressValSan', () => {
	const valSan = new IpAddressValSan();

	it('validates IPv4', async () => {
		const result = await valSan.run('192.168.1.1');
		expect(result.success).toBe(true);
	});

	it('validates IPv6', async () => {
		const result = await valSan.run(
			'2001:0db8:85a3:0000:0000:8a2e:0370:7334'
		);

		expect(result.success).toBe(true);
	});

	it('validates compressed IPv6', async () => {
		for (const address of ['::', '::1', '2001:db8::1', 'fe80::1']) {
			const result = await valSan.run(address);
			expect(result.success).withContext(address).toBe(true);
		}
	});

	it('validates IPv4-mapped IPv6', async () => {
		const result = await valSan.run('::ffff:192.0.2.1');
		expect(result.success).toBe(true);
	});

	it('rejects invalid IP', async () => {
		const result = await valSan.run('999.999.999.999');
		expect(result.success).toBe(false);
	});

	it('trims whitespace in sanitize', async () => {
		const result = await valSan.run(' 192.168.1.1 ');
		expect(result.success).toBe(true);
		expect(result.data).toBe('192.168.1.1');
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

	it('rejects IP with letters', async () => {
		const result = await valSan.run('abc.def.ghi.jkl');
		expect(result.success).toBe(false);
	});

	it('rejects too short IPv4', async () => {
		const result = await valSan.run('1.1.1');
		expect(result.success).toBe(false);
	});

	it('rejects too long IPv4', async () => {
		const result = await valSan.run('1.1.1.1.1');
		expect(result.success).toBe(false);
	});

	it('rejects malformed IPv6', async () => {
		for (const address of [
			'2001:db8::1::1',
			'2001:db8:::1',
			'1:2:3:4:5:6:7:8:9',
			'1:2:3:4:5:6:7::8',
			'1:2:3:4:5:6:192.0.2.1:8',
			'192.0.2.1::',
			'::ffff:999.0.2.1',
			'fe80::1%eth0',
		]) {
			const result = await valSan.run(address);
			expect(result.success).withContext(address).toBe(false);
		}
	});

	it('rejects non-string input', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valSan.run(123 as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});
});
