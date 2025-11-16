import 'jasmine';
import { EmailValidator } from '../../../../src';

describe('EmailValidator', () => {
	it('should validate a correct email', async () => {
		const validator = new EmailValidator();
		const result = await validator.run('test@example.com');
		expect(result.success).toBe(true);
		expect(result.data).toBe('test@example.com');
	});

	it('should invalidate an incorrect email', async () => {
		const validator = new EmailValidator();
		const result = await validator.run('not-an-email');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('email_format');
	});

	it('rejects undefined input', async () => {
		const validator = new EmailValidator();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('should reject plus addressing if not allowed', async () => {
		const validator = new EmailValidator({ allowPlusAddress: false });
		const result = await validator.run('user+tag@example.com');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('email_format');
	});

	it('should allow plus addressing if allowed', async () => {
		const validator = new EmailValidator({ allowPlusAddress: true });
		const result = await validator.run('user+tag@example.com');
		expect(result.success).toBe(true);
		expect(result.data).toBe('user+tag@example.com');
	});

	it('should allow only specified domains', async () => {
		const validator = new EmailValidator({
			allowedDomains: ['example.com'],
		});
		const result1 = await validator.run('user@example.com');
		const result2 = await validator.run('user@notallowed.com');
		expect(result1.success).toBe(true);
		expect(result2.success).toBe(false);
		expect(result2.errors[0].code).toBe('email_domain');
	});

	it('should allow custom error message', async () => {
		const validator = new (class extends EmailValidator {
			override rules() {
				return {
					...super.rules(),
					invalid: {
						code: 'email_format',
						user: {
							helperText: 'Email',
							errorMessage: 'Custom error',
						},
						context: {
							allowPlusAddress: this.allowPlusAddress,
						},
					},
				};
			}
		})();

		const result = await validator.run('bad@');
		expect(result.success).toBe(false);
		expect(result.errors[0].message).toBe('Custom error');
	});

	it('should pass with isOptional and undefined', async () => {
		const validator = new EmailValidator({ isOptional: true });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(undefined as any);
		expect(result.success).toBe(true);
		expect(result.data).toBe(undefined);
	});

	it('should reject non-string input', async () => {
		const validator = new EmailValidator();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(123 as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});
});
