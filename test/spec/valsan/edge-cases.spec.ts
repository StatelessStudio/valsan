import 'jasmine';
import { ValSan, ValidationResult } from '../../../src';
import { TestValSan } from './test-implementations';

describe('ValSan - Edge Cases', () => {
	it('should handle empty string input', async () => {
		const valsan = new TestValSan();
		const result = await valsan.run('');

		expect(result.success).toBe(false);
	});

	it('should handle async normalize operations', async () => {
		class AsyncNormalizeValSan extends ValSan<string, string> {
			override async normalize(input: string): Promise<string> {
				// Simulate async operation
				await new Promise((resolve) => setTimeout(resolve, 10));
				return input?.trim();
			}

			async validate(): Promise<ValidationResult> {
				return { isValid: true, errors: [] };
			}

			async sanitize(input: string): Promise<string> {
				return input;
			}
		}

		const valsan = new AsyncNormalizeValSan();
		const result = await valsan.run('  test  ');

		expect(result.success).toBe(true);
		expect(result.data).toBe('test');
	});

	it('should handle async validate operations', async () => {
		class AsyncValidateValSan extends ValSan<string, string> {
			async validate(): Promise<ValidationResult> {
				// Simulate async validation (e.g., database check)
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { isValid: true, errors: [] };
			}

			async sanitize(input: string): Promise<string> {
				return input;
			}
		}

		const valsan = new AsyncValidateValSan();
		const result = await valsan.run('test');

		expect(result.success).toBe(true);
	});

	it('should handle async sanitize operations', async () => {
		class AsyncSanitizeValSan extends ValSan<string, string> {
			async validate(): Promise<ValidationResult> {
				return { isValid: true, errors: [] };
			}

			async sanitize(input: string): Promise<string> {
				// Simulate async sanitization (e.g., API call)
				await new Promise((resolve) => setTimeout(resolve, 10));
				return input.toUpperCase();
			}
		}

		const valsan = new AsyncSanitizeValSan();
		const result = await valsan.run('test');

		expect(result.success).toBe(true);
		expect(result.data).toBe('TEST');
	});
});
