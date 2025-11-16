// eslint-disable-next-line max-len
import { MacAddressValSan } from '../../../../src/primitives/network/mac-address-valsan';

describe('MacAddressValSan', () => {
	const valSan = new MacAddressValSan();

	it('validates colon format', async () => {
		const result = await valSan.run('00:1A:2B:3C:4D:5E');
		expect(result.success).toBe(true);
	});

	it('validates dash format', async () => {
		const result = await valSan.run('00-1A-2B-3C-4D-5E');
		expect(result.success).toBe(true);
	});

	it('validates dot format', async () => {
		const result = await valSan.run('001A.2B3C.4D5E');
		expect(result.success).toBe(true);
	});

	it('rejects invalid MAC', async () => {
		const result = await valSan.run('ZZ:ZZ:ZZ:ZZ:ZZ:ZZ');
		expect(result.success).toBe(false);
	});

	it('trims whitespace in sanitize', async () => {
		const result = await valSan.run(' 00:1A:2B:3C:4D:5E ');
		expect(result.success).toBe(true);
		expect(result.data).toBe('00:1A:2B:3C:4D:5E');
	});

	it('accepts lowercase MAC', async () => {
		const result = await valSan.run('00:1a:2b:3c:4d:5e');
		expect(result.success).toBe(true);
	});

	it('accepts mixed case MAC', async () => {
		const result = await valSan.run('00:1a:2B:3C:4d:5E');
		expect(result.success).toBe(true);
	});

	it('rejects too short MAC', async () => {
		const result = await valSan.run('00:1A:2B:3C:4D');
		expect(result.success).toBe(false);
	});

	it('rejects too long MAC', async () => {
		const result = await valSan.run('00:1A:2B:3C:4D:5E:7F');
		expect(result.success).toBe(false);
	});

	it('rejects MAC with invalid chars', async () => {
		const result = await valSan.run('00:1G:2B:3C:4D:5E');
		expect(result.success).toBe(false);
	});

	it('rejects undefined input', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valSan.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('rejects non-string input', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valSan.run(123 as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});
});
