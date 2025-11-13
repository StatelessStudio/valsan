import 'jasmine';
import { ValSan, ValidationResult } from '../../../src';
import { NormalizingValSan } from './test-implementations';

describe('ValSan - ValidationError Interface', () => {
	it('should support errors without field property', async () => {
		const valsan = new NormalizingValSan();
		const result = await valsan.run('invalid');

		expect(result.errors[0].field).toBeUndefined();
	});

	it('should support optional context property', async () => {
		class ContextValSan extends ValSan<string, string> {
			async validate(): Promise<ValidationResult> {
				return {
					isValid: false,
					errors: [
						{
							code: 'WITH_CONTEXT',
							message: 'Error with context',
							context: {
								minLength: 5,
							},
						},
					],
				};
			}

			async sanitize(input: string): Promise<string> {
				return input;
			}
		}

		const valsan = new ContextValSan();
		const result = await valsan.run('abc');

		expect(result.errors[0].context).toEqual({
			minLength: 5,
		});
	});
});
