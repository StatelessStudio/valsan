import 'jasmine';
import { StringToDateValSan } from '../../../../src';

describe('StringToDateValSan', () => {
	it('should convert ISO date strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('2024-01-15');
		expect(result.success).toBe(true);
		expect(result.data instanceof Date).toBe(true);
	});

	it('should convert full ISO datetime strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('2024-01-15T10:30:00Z');
		expect(result.success).toBe(true);
		expect(result.data instanceof Date).toBe(true);
	});

	it('should convert various date formats', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('January 15, 2024');
		expect(result.success).toBe(true);
		expect(result.data instanceof Date).toBe(true);
	});

	it('should reject invalid date strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('not a date');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_DATE');
	});

	it('should reject empty strings', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('INVALID_DATE');
	});

	it('should reject invalid dates like 2024-13-45', async () => {
		const validator = new StringToDateValSan();
		const result = await validator.run('2024-13-45');
		expect(result.success).toBe(false);
	});
});
