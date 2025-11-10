import 'jasmine';
import { ValSan, ValidationResult } from '../../../src';
import { TestValSan } from './test-implementations';

describe('ValSan - Validation Failures', () => {
	it('should return failure with errors for invalid input', async () => {
		const valsan = new TestValSan();
		const result = await valsan.run('ab');

		expect(result.success).toBe(false);
		expect(result.data).toBeUndefined();
		expect(result.errors).toEqual([
			{
				code: 'TOO_SHORT',
				message: 'Input must be at least 3 characters',
				field: 'testField',
			},
		]);
	});

	it('should return multiple validation errors', async () => {
		class MultiErrorValSan extends ValSan<string, string> {
			async validate(): Promise<ValidationResult> {
				return {
					isValid: false,
					errors: [
						{ code: 'ERROR_1', message: 'First error' },
						{ code: 'ERROR_2', message: 'Second error' },
					],
				};
			}

			async sanitize(input: string): Promise<string> {
				return input;
			}
		}

		const valsan = new MultiErrorValSan();
		const result = await valsan.run('test');

		expect(result.success).toBe(false);
		expect(result.errors.length).toBe(2);
		expect(result.errors[0].code).toBe('ERROR_1');
		expect(result.errors[1].code).toBe('ERROR_2');
	});
});
