import 'jasmine';
import {
	OptionsTestValSan,
	MinLengthValSan,
	CaseTransformValSan,
	ComplexOptionsValSan,
} from './test-implementations';

describe('ValSan - Options', () => {
	describe('constructor options', () => {
		it('should accept options in constructor', () => {
			const valsan = new OptionsTestValSan({ testOption: 'value' });
			expect(valsan).toBeDefined();
		});

		it('should work with default empty options', () => {
			const valsan = new OptionsTestValSan();
			expect(valsan).toBeDefined();
		});

		it('should work with no options passed', async () => {
			const valsan = new MinLengthValSan();
			const result = await valsan.run('hello');
			expect(result.success).toBe(true);
		});
	});

	describe('using options in validation', () => {
		it('should use minLength option for validation', async () => {
			const valsan = new MinLengthValSan({ minLength: 5 });
			const result = await valsan.run('hi');

			expect(result.success).toBe(false);
			expect(result.errors).toEqual([
				{
					code: 'TOO_SHORT',
					message: 'Input must be at least 5 characters',
					context: { minLength: 5, actualLength: 2 },
				},
			]);
		});

		it('passes validation if meeting minLength requirement', async () => {
			const valsan = new MinLengthValSan({ minLength: 3 });
			const result = await valsan.run('hello');

			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should isolate options between instances', async () => {
			const valsan1 = new MinLengthValSan({ minLength: 3 });
			const valsan2 = new MinLengthValSan({ minLength: 10 });

			const result1 = await valsan1.run('hello');
			const result2 = await valsan2.run('hello');

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(false);
		});
	});

	describe('using options in normalize', () => {
		it('should apply uppercase transformation from options', async () => {
			const valsan = new CaseTransformValSan({ transform: 'uppercase' });
			const result = await valsan.run('hello');

			expect(result.success).toBe(true);
			expect(result.data).toBe('HELLO');
		});

		it('should apply lowercase transformation from options', async () => {
			const valsan = new CaseTransformValSan({ transform: 'lowercase' });
			const result = await valsan.run('HELLO');

			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should not transform when transform is none', async () => {
			const valsan = new CaseTransformValSan({ transform: 'none' });
			const result = await valsan.run('HeLLo');

			expect(result.success).toBe(true);
			expect(result.data).toBe('HeLLo');
		});
	});

	describe('using options in sanitize', () => {
		it('should apply prefix option in sanitize', async () => {
			const valsan = new OptionsTestValSan({ prefix: 'PREFIX_' });
			const result = await valsan.run('test');

			expect(result.success).toBe(true);
			expect(result.data).toBe('PREFIX_test');
		});

		it('should work without prefix option', async () => {
			const valsan = new OptionsTestValSan();
			const result = await valsan.run('test');

			expect(result.success).toBe(true);
			expect(result.data).toBe('test');
		});
	});

	describe('complex options', () => {
		it('should handle options with nested objects', async () => {
			const valsan = new ComplexOptionsValSan({
				validation: {
					minLength: 5,
					maxLength: 20,
					pattern: /^[a-z]+$/,
				},
				sanitization: {
					trim: true,
					lowercase: true,
				},
			});

			const result = await valsan.run('  HELLO  ');

			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should validate against pattern from options', async () => {
			const valsan = new ComplexOptionsValSan({
				validation: {
					minLength: 3,
					maxLength: 20,
					pattern: /^[0-9]+$/,
				},
			});

			const result = await valsan.run('abc');

			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('PATTERN_MISMATCH');
		});

		it('should respect maxLength from options', async () => {
			const valsan = new ComplexOptionsValSan({
				validation: {
					minLength: 1,
					maxLength: 5,
				},
			});

			const result = await valsan.run('toolong');

			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('TOO_LONG');
		});
	});

	describe('options with default values', () => {
		it('should use default minLength when not provided', async () => {
			const valsan = new MinLengthValSan();
			const result = await valsan.run('x');

			expect(result.success).toBe(false);
			expect(result.errors[0].context?.['minLength']).toBe(3);
		});

		it('should override default when option is provided', async () => {
			const valsan = new MinLengthValSan({ minLength: 10 });
			const result = await valsan.run('short');

			expect(result.success).toBe(false);
			expect(result.errors[0].context?.['minLength']).toBe(10);
		});
	});
});
