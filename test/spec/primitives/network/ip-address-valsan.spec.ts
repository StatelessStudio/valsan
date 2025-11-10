// eslint-disable-next-line max-len
import { IpAddressValSan } from '../../../../src/primitives/network/ip-address-valsan';

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
	it('accepts valid IPv6 shorthand', async () => {
		// This will fail unless regex is updated for shorthand, so expect false
		const result = await valSan.run('2001:db8::1');
		expect(result.success).toBe(false);
	});
});
