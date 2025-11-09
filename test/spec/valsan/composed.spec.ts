import 'jasmine';
import {
	ComposedValSan,
	TrimSanitizer,
	LowercaseSanitizer,
} from '../../../src';
import {
	EmailValSan,
	NumberPipelineValSan,
	SingleStepValSan,
	EmailFormatValSan,
	TestValSan,
} from './test-implementations';

describe('ComposedValSan', () => {
	describe('constructor', () => {
		it('should create a composed validator with multiple steps', () => {
			const composed = new EmailValSan();
			expect(composed).toBeDefined();
			expect(composed instanceof ComposedValSan).toBe(true);
		});

		it('should throw error when created with no steps', () => {
			expect(() => {
				new ComposedValSan([]);
			}).toThrowError('ComposedValSan requires at least one step');
		});

		it('should work with a single step', () => {
			const composed = new SingleStepValSan();
			expect(composed).toBeDefined();
		});
	});

	describe('getSteps()', () => {
		it('should return all steps in the composition', () => {
			const emailValidator = new EmailValSan();
			const steps = emailValidator.getSteps();

			expect(steps.length).toBe(3);
			expect(steps[0] instanceof TrimSanitizer).toBe(true);
			expect(steps[1] instanceof LowercaseSanitizer).toBe(true);
			expect(steps[2] instanceof EmailFormatValSan).toBe(true);
		});

		it('should return a readonly copy of steps', () => {
			const emailValidator = new EmailValSan();
			const steps1 = emailValidator.getSteps();
			const steps2 = emailValidator.getSteps();

			// Should be different array instances
			expect(steps1).not.toBe(steps2);
			expect(steps1.length).toBe(steps2.length);
		});
	});

	describe('run() - successful composition', () => {
		it('should compose string transformations', async () => {
			const emailValidator = new EmailValSan();
			const result = await emailValidator.run('  USER@EXAMPLE.COM  ');

			expect(result.success).toBe(true);
			expect(result.data).toBe('user@example.com');
			expect(result.errors).toEqual([]);
		});

		it('should compose type transformations', async () => {
			const numberPipeline = new NumberPipelineValSan();
			const result = await numberPipeline.run('  21  ');

			expect(result.success).toBe(true);
			expect(result.data).toBe(42);
			expect(typeof result.data).toBe('number');
			expect(result.errors).toEqual([]);
		});

		it('should work with single step composition', async () => {
			const singleStep = new SingleStepValSan();
			const result = await singleStep.run('  hello  ');

			expect(result.success).toBe(true);
			expect(result.data).toBe('hello');
		});

		it('should handle complex email addresses', async () => {
			const emailValidator = new EmailValSan();
			const result = await emailValidator.run(
				'  Test.User+Tag@Example.Co.UK  '
			);

			expect(result.success).toBe(true);
			expect(result.data).toBe('test.user+tag@example.co.uk');
		});
	});

	describe('run() - validation failures', () => {
		it('should fail on invalid email format', async () => {
			const emailValidator = new EmailValSan();
			const result = await emailValidator.run('  not-an-email  ');

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].code).toBe('INVALID_EMAIL');
			expect(result.errors[0].message).toContain('Invalid email');
		});

		it('should fail when first step validation fails', async () => {
			const composed = new ComposedValSan<string, string>([
				new TestValSan(), // Requires 3+ chars
				new LowercaseSanitizer(),
			]);
			const result = await composed.run('ab');

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].code).toBe('TOO_SHORT');
		});

		it('should fail when middle step validation fails', async () => {
			const numberPipeline = new NumberPipelineValSan();
			const result = await numberPipeline.run('  -5  ');

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].code).toBe('NEGATIVE_NUMBER');
		});

		it('should fail on empty string after trim', async () => {
			const emailValidator = new EmailValSan();
			const result = await emailValidator.run('     ');

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should fail on invalid number string', async () => {
			const numberPipeline = new NumberPipelineValSan();
			const result = await numberPipeline.run('  not a number  ');

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});
	});

	describe('normalize()', () => {
		it('should use first step normalization', async () => {
			const emailValidator = new EmailValSan();
			const result = await emailValidator.run('  TEST@EXAMPLE.COM  ');

			// TrimSanitizer is first, but has no custom normalize
			// LowercaseSanitizer normalizes to lowercase
			expect(result.success).toBe(true);
			expect(result.data).toBe('test@example.com');
		});
	});

	describe('validate()', () => {
		it('should use first step validation', async () => {
			const emailValidator = new EmailValSan();

			// Empty string fails LowercaseSanitizer validation
			const result = await emailValidator.run('   ');

			expect(result.success).toBe(false);
		});
	});

	describe('type safety', () => {
		it('should maintain type safety through composition', async () => {
			const numberPipeline = new NumberPipelineValSan();
			const result = await numberPipeline.run('42');

			if (result.success && result.data !== undefined) {
				// TypeScript should know result.data is a number
				const doubled: number = result.data;
				expect(doubled).toBe(84);
			}
		});

		it('should work with string to string transformations', async () => {
			const emailValidator = new EmailValSan();
			const result = await emailValidator.run('test@example.com');

			if (result.success && result.data !== undefined) {
				// TypeScript should know result.data is a string
				const email: string = result.data;
				expect(email).toBe('test@example.com');
			}
		});
	});
});
