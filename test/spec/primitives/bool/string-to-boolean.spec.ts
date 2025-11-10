import 'jasmine';
import { StringToBooleanValSan } from '../../../../src';

describe('StringToBooleanValSan', () => {
	it('should convert "true" to true', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('true');
		expect(result.success).toBe(true);
		expect(result.data).toBe(true);
	});

	it('should convert "false" to false', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('false');
		expect(result.success).toBe(true);
		expect(result.data).toBe(false);
	});

	it('should be case-insensitive for "true"', async () => {
		const validator = new StringToBooleanValSan();
		const result1 = await validator.run('TRUE');
		const result2 = await validator.run('True');
		const result3 = await validator.run('TrUe');
		expect(result1.data).toBe(true);
		expect(result2.data).toBe(true);
		expect(result3.data).toBe(true);
	});

	it('should be case-insensitive for "false"', async () => {
		const validator = new StringToBooleanValSan();
		const result1 = await validator.run('FALSE');
		const result2 = await validator.run('False');
		expect(result1.data).toBe(false);
		expect(result2.data).toBe(false);
	});

	it('should convert "1" to true', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('1');
		expect(result.success).toBe(true);
		expect(result.data).toBe(true);
	});

	it('should convert "0" to false', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('0');
		expect(result.success).toBe(true);
		expect(result.data).toBe(false);
	});

	it('should convert "yes" to true', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('yes');
		expect(result.success).toBe(true);
		expect(result.data).toBe(true);
	});

	it('should convert "no" to false', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('no');
		expect(result.success).toBe(true);
		expect(result.data).toBe(false);
	});

	it('should convert "on" to true', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('on');
		expect(result.success).toBe(true);
		expect(result.data).toBe(true);
	});

	it('should convert "off" to false', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('off');
		expect(result.success).toBe(true);
		expect(result.data).toBe(false);
	});

	it('should reject invalid boolean strings', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('maybe');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_BOOLEAN');
	});

	it('should include allowed values in error context', async () => {
		const validator = new StringToBooleanValSan();
		const result = await validator.run('invalid');
		expect(result.success).toBe(false);
		expect(result.errors[0].context?.['allowedTrue']).toBeDefined();
		expect(result.errors[0].context?.['allowedFalse']).toBeDefined();
	});

	it('should support custom true values', async () => {
		const validator = new StringToBooleanValSan({
			trueValues: ['y', 'yes'],
			falseValues: ['n', 'no'],
		});
		const result1 = await validator.run('y');
		const result2 = await validator.run('n');
		expect(result1.data).toBe(true);
		expect(result2.data).toBe(false);
	});

	it('should reject old values when using custom values', async () => {
		const validator = new StringToBooleanValSan({
			trueValues: ['y'],
			falseValues: ['n'],
		});
		const result = await validator.run('true');
		expect(result.success).toBe(false);
	});

	it('should be case-insensitive with custom values', async () => {
		const validator = new StringToBooleanValSan({
			trueValues: ['accept'],
			falseValues: ['reject'],
		});
		const result1 = await validator.run('ACCEPT');
		const result2 = await validator.run('REJECT');
		expect(result1.data).toBe(true);
		expect(result2.data).toBe(false);
	});
});
