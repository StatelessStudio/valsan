import 'jasmine';
import { NormalizingValSan, TestValSan } from './test-implementations';

describe('ValSan - Normalization', () => {
	it('should apply normalization before validation', async () => {
		const valsan = new NormalizingValSan();
		const result = await valsan.run('  VALID  ');

		expect(result.success).toBe(true);
		expect(result.data).toBe('valid');
	});

	it('should normalize input before detecting invalid content', async () => {
		const valsan = new NormalizingValSan();
		const result = await valsan.run('  INVALID  ');

		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_WORD');
	});

	it('should use default normalize when not overridden', async () => {
		const valsan = new TestValSan();
		const input = 'test';
		const normalized = await valsan['normalize'](input);

		expect(normalized).toBe(input);
	});
});
