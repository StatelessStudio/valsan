import 'jasmine';
import { LowercaseSanitizer } from '../../../../src';

describe('LowercaseSanitizer', () => {
	it('should convert string to lowercase', async () => {
		const sanitizer = new LowercaseSanitizer();
		const result = await sanitizer.run('HELLO');
		expect(result.success).toBe(true);
		expect(result.data).toBe('hello');
	});

	it('should reject null input by default', async () => {
		const sanitizer = new LowercaseSanitizer();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await sanitizer.run(null as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should allow empty strings with isOptional', async () => {
		const sanitizer = new LowercaseSanitizer({ isOptional: true });
		const result = await sanitizer.run('');
		expect(result.success).toBe(true);
		expect(result.data).toBe('');
	});

	it('should handle mixed case', async () => {
		const sanitizer = new LowercaseSanitizer();
		const result = await sanitizer.run('HeLLo WoRLd');
		expect(result.success).toBe(true);
		expect(result.data).toBe('hello world');
	});

	it('should reject non-string input', async () => {
		const sanitizer = new LowercaseSanitizer();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await sanitizer.run(123 as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});
});
