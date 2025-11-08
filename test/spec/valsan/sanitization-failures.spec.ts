import 'jasmine';
import {
	ThrowingSanitizeValSan,
	ThrowingNonErrorValSan,
} from './test-implementations';

describe('ValSan - Sanitization Failures', () => {
	it('should catch sanitization errors and return failure', async () => {
		const valsan = new ThrowingSanitizeValSan();
		const result = await valsan.run('valid');

		expect(result.success).toBe(false);
		expect(result.data).toBeUndefined();
		expect(result.errors).toEqual([
			{
				code: 'SANITIZE_ERROR',
				message: 'Sanitization error occurred',
			},
		]);
	});

	it('should handle non-Error throws during sanitization', async () => {
		const valsan = new ThrowingNonErrorValSan();
		const result = await valsan.run('valid');

		expect(result.success).toBe(false);
		expect(result.errors).toEqual([
			{
				code: 'SANITIZE_ERROR',
				message: 'Sanitization failed',
			},
		]);
	});
});
