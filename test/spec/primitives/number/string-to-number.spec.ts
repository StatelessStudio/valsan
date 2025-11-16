import 'jasmine';
import { StringToNumberValSan } from '../../../../src';

describe('StringToNumberValSan', () => {
	it('should convert valid number strings', async () => {
		const validator = new StringToNumberValSan();
		const result = await validator.run('42');
		expect(result.success).toBe(true);
		expect(result.data).toBe(42);
		expect(typeof result.data).toBe('number');
	});

	it('should convert decimal strings', async () => {
		const validator = new StringToNumberValSan();
		const result = await validator.run('3.14');
		expect(result.success).toBe(true);
		expect(result.data).toBe(3.14);
	});

	it('should convert negative numbers', async () => {
		const validator = new StringToNumberValSan();
		const result = await validator.run('-42');
		expect(result.success).toBe(true);
		expect(result.data).toBe(-42);
	});

	it('should convert zero', async () => {
		const validator = new StringToNumberValSan();
		const result = await validator.run('0');
		expect(result.success).toBe(true);
		expect(result.data).toBe(0);
	});

	it('should reject non-numeric strings', async () => {
		const validator = new StringToNumberValSan();
		const result = await validator.run('not a number');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('number');
	});

	it('should reject undefined input', async () => {
		const validator = new StringToNumberValSan();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should convert empty strings to 0', async () => {
		const validator = new StringToNumberValSan();
		const result = await validator.run('');
		expect(result.success).toBe(true);
		expect(result.data).toBe(0);
	});

	it('should handle scientific notation', async () => {
		const validator = new StringToNumberValSan();
		const result = await validator.run('1e3');
		expect(result.success).toBe(true);
		expect(result.data).toBe(1000);
	});
});
