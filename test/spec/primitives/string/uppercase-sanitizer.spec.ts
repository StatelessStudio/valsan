import 'jasmine';
import { UppercaseSanitizer } from '../../../../src';

describe('UppercaseSanitizer', () => {
	it('should convert string to uppercase', async () => {
		const sanitizer = new UppercaseSanitizer();
		const result = await sanitizer.run('hello');
		expect(result.success).toBe(true);
		expect(result.data).toBe('HELLO');
	});

	it('should reject null input by default', async () => {
		const sanitizer = new UppercaseSanitizer();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await sanitizer.run(null as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('NOT_A_STRING');
	});

	it('should allow empty strings with isOptional', async () => {
		const sanitizer = new UppercaseSanitizer({ isOptional: true });
		const result = await sanitizer.run('');
		expect(result.success).toBe(true);
		expect(result.data).toBe('');
	});

	it('should handle mixed case', async () => {
		const sanitizer = new UppercaseSanitizer();
		const result = await sanitizer.run('HeLLo WoRLd');
		expect(result.success).toBe(true);
		expect(result.data).toBe('HELLO WORLD');
	});
});
