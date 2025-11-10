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
	ConfigurableEmailValSan,
	ConfigurableNumberPipelineValSan,
	SimpleComposedWithOptionsValSan,
	EmailWithLengthValSan,
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

	describe('constructor options', () => {
		it('should accept options in constructor', () => {
			const valsan = new SimpleComposedWithOptionsValSan({
				skipTrim: true,
			});
			expect(valsan).toBeDefined();
		});

		it('should work with default empty options', () => {
			const valsan = new SimpleComposedWithOptionsValSan();
			expect(valsan).toBeDefined();
		});

		it('should work when passing no options', async () => {
			const valsan = new ConfigurableEmailValSan();
			const result = await valsan.run('test@example.com');
			expect(result.success).toBe(true);
		});
	});

	describe('using options to configure steps', () => {
		it('should conditionally include steps based on options', async () => {
			const withTrim = new SimpleComposedWithOptionsValSan({
				skipTrim: false,
			});
			const withoutTrim = new SimpleComposedWithOptionsValSan({
				skipTrim: true,
			});

			const result1 = await withTrim.run('  HELLO  ');
			const result2 = await withoutTrim.run('  HELLO  ');

			expect(result1.success).toBe(true);
			expect(result1.data).toBe('hello');

			expect(result2.success).toBe(true);
			expect(result2.data).toBe('  hello  ');
		});

		it('should allow uppercase when configured', async () => {
			const allowUppercase = new ConfigurableEmailValSan({
				allowUppercase: true,
			});
			const result = await allowUppercase.run('TEST@EXAMPLE.COM');

			expect(result.success).toBe(true);
			expect(result.data).toBe('TEST@EXAMPLE.COM');
		});

		it('should lowercase by default', async () => {
			const defaultBehavior = new ConfigurableEmailValSan();
			const result = await defaultBehavior.run('TEST@EXAMPLE.COM');

			expect(result.success).toBe(true);
			expect(result.data).toBe('test@example.com');
		});
	});

	describe('using options in run method', () => {
		it('should validate custom domain when specified', async () => {
			const validator = new ConfigurableEmailValSan({
				customDomain: 'example.com',
			});

			const result1 = await validator.run('user@example.com');
			const result2 = await validator.run('user@other.com');

			expect(result1.success).toBe(true);
			expect(result1.data).toBe('user@example.com');

			expect(result2.success).toBe(false);
			expect(result2.errors[0].code).toBe('INVALID_DOMAIN');
			expect(result2.errors[0].message).toContain('example.com');
		});

		it('should not validate domain when not specified', async () => {
			const validator = new ConfigurableEmailValSan();

			const result = await validator.run('user@any-domain.com');

			expect(result.success).toBe(true);
			expect(result.data).toBe('user@any-domain.com');
		});

		it('should apply multiplier when specified', async () => {
			const validator = new ConfigurableNumberPipelineValSan({
				multiplier: 3,
			});

			const result = await validator.run('10');

			expect(result.success).toBe(true);
			expect(result.data).toBe(60); // 10 * 2 (doubled) * 3 (multiplier)
		});

		it('should work without multiplier', async () => {
			const validator = new ConfigurableNumberPipelineValSan();

			const result = await validator.run('10');

			expect(result.success).toBe(true);
			expect(result.data).toBe(20); // 10 * 2 (doubled)
		});
	});

	describe('options isolation', () => {
		it('should isolate options between instances', async () => {
			const validator1 = new ConfigurableEmailValSan({
				customDomain: 'example.com',
			});
			const validator2 = new ConfigurableEmailValSan({
				customDomain: 'other.com',
			});

			const result1 = await validator1.run('user@example.com');
			const result2 = await validator2.run('user@example.com');

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(false);
		});

		it('should handle different multipliers independently', async () => {
			const validator1 = new ConfigurableNumberPipelineValSan({
				multiplier: 2,
			});
			const validator2 = new ConfigurableNumberPipelineValSan({
				multiplier: 5,
			});

			const result1 = await validator1.run('10');
			const result2 = await validator2.run('10');

			expect(result1.data).toBe(40); // 10 * 2 * 2
			expect(result2.data).toBe(100); // 10 * 2 * 5
		});
	});

	describe('passing options to child steps', () => {
		it('should pass maxLength option to child validator', async () => {
			const validator = new EmailWithLengthValSan({
				maxLength: 20,
			});

			const result1 = await validator.run('short@test.com');
			const result2 = await validator.run(
				'verylongemailaddress@example.com'
			);

			expect(result1.success).toBe(true);
			expect(result1.data).toBe('short@test.com');

			expect(result2.success).toBe(false);
			expect(result2.errors[0].code).toBe('STRING_TOO_LONG');
		});

		it('should pass minLength option to child validator', async () => {
			const validator = new EmailWithLengthValSan({
				minLength: 10,
			});

			const result1 = await validator.run('test@example.com');
			const result2 = await validator.run('a@b.c');

			expect(result1.success).toBe(true);
			expect(result1.data).toBe('test@example.com');

			expect(result2.success).toBe(false);
			expect(result2.errors[0].code).toBe('TOO_SHORT');
		});

		it('should pass both min and max length options', async () => {
			const validator = new EmailWithLengthValSan({
				minLength: 10,
				maxLength: 30,
			});

			const result1 = await validator.run('test@example.com');
			const result2 = await validator.run('a@b.c');
			const result3 = await validator.run(
				'verylongemailaddress@example.com'
			);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(false);
			expect(result2.errors[0].code).toBe('TOO_SHORT');
			expect(result3.success).toBe(false);
			expect(result3.errors[0].code).toBe('STRING_TOO_LONG');
		});

		it('should work without any length options', async () => {
			const validator = new EmailWithLengthValSan();

			const result = await validator.run('test@example.com');

			expect(result.success).toBe(true);
			expect(result.data).toBe('test@example.com');
		});

		it('should isolate child options between instances', async () => {
			const strict = new EmailWithLengthValSan({ maxLength: 15 });
			const lenient = new EmailWithLengthValSan({ maxLength: 50 });

			const email = 'moderatelength@test.com';
			const result1 = await strict.run(email);
			const result2 = await lenient.run(email);

			expect(result1.success).toBe(false);
			expect(result2.success).toBe(true);
		});
	});
});
