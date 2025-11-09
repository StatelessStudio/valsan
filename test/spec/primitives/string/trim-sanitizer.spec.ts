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

	it('should handle empty strings', async () => {
		const sanitizer = new TrimSanitizer();
		const result = await sanitizer.run('');
		expect(result.success).toBe(true);
		expect(result.data).toBe('');
	});
});
