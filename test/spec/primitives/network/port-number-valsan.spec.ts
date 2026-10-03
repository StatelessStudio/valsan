// eslint-disable-next-line max-len
import { PortNumberValSan } from '../../../../src/primitives/network/port-number-valsan';

describe('PortNumberValSan', () => {
	const valSan = new PortNumberValSan();

	it('accepts valid port', async () => {
		const result = await valSan.run(8080);
		expect(result.success).toBe(true);
	});

	it('accepts valid port as string', async () => {
		const result = await valSan.run('443');
		expect(result.success).toBe(true);
	});

	it('rejects negative port', async () => {
		const result = await valSan.run(-1);
		expect(result.success).toBe(false);
	});

	it('rejects undefined input', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await valSan.run(undefined as any);
		expect(result.success).toBe(false);
	});

	it('rejects non-numeric string', async () => {
		const result = await valSan.run('invalidPort');
		expect(result.success).toBe(false);
	});

	it('rejects port > 65535', async () => {
		const result = await valSan.run(70000);
		expect(result.success).toBe(false);
	});

	it('trims whitespace in sanitize', async () => {
		const result = await valSan.run(' 1234 ');
		expect(result.success).toBe(true);
		expect(result.data).toBe(1234);
	});

	it('rejects blank strings and rounded fractions', async () => {
		for (const input of ['', '  ', '1.00000000000000001']) {
			const result = await valSan.run(input);
			expect(result.success).withContext(input).toBe(false);
			expect(result.errors[0].code).toBe('number');
		}
	});

	it('rejects unsupported runtime types without coercion', async () => {
		for (const input of [true, false, [], {}, Symbol('port'), 443n]) {
			// @ts-expect-error: testing unsupported runtime input
			const result = await valSan.run(input);
			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('number');
		}
	});

	it('rejects non-numeric string', async () => {
		const result = await valSan.run('notaport');
		expect(result.success).toBe(false);
	});

	it('rejects float number', async () => {
		const result = await valSan.run(123.45);
		expect(result.success).toBe(false);
	});

	it('rejects string float', async () => {
		const result = await valSan.run('123.45');
		expect(result.success).toBe(false);
	});

	it('accepts port 0', async () => {
		const result = await valSan.run(0);
		expect(result.success).toBe(true);
	});

	it('accepts port 65535', async () => {
		const result = await valSan.run(65535);
		expect(result.success).toBe(true);
	});
});
