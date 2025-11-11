import 'jasmine';
import { TrimSanitizer } from '../../../../src';

describe('TrimSanitizer', () => {
	it('should trim whitespace from both ends', async () => {
		const sanitizer = new TrimSanitizer();
		const result = await sanitizer.run('  hello  ');
		expect(result.success).toBe(true);
		expect(result.data).toBe('hello');
	});

	it('should handle strings without whitespace', async () => {
		const sanitizer = new TrimSanitizer();
		const result = await sanitizer.run('hello');
		expect(result.success).toBe(true);
		expect(result.data).toBe('hello');
	});

	it('should accept undefined input', async () => {
		const sanitizer = new TrimSanitizer();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await sanitizer.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors).toBeDefined();
		expect(result.errors[0].code).toBe('INVALID_STRING');
	});

	it('should handle empty strings', async () => {
		const sanitizer = new TrimSanitizer();
		const result = await sanitizer.run('');
		expect(result.success).toBe(true);
		expect(result.data).toBe('');
	});
});
