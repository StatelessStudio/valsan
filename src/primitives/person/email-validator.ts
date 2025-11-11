import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';
import { isString } from '../string/is-string';

export interface EmailValidatorOptions extends ValSanOptions {
	/**
	 * Custom error message when email is invalid.
	 */
	errorMessage?: string;

	/**
	 * If false, disallow plus (+) addressing
	 *  (e.g. user+tag@example.com).
	 *
	 * @default true
	 */
	allowPlusAddress?: boolean;

	/**
	 * If set, only allow emails from these domains
	 *  (case-insensitive, no leading @).
	 */
	allowedDomains?: string[];
}

/**
 * Validates that a string is a valid email address.
 *
 * Does not modify the input string.
 *
 * @example
 * ```typescript
 * const validator = new EmailValidator();
 * const result = await validator.run('test@example.com');
 * // result.success === true
 * ```
 */
export class EmailValidator extends ValSan<string, string> {
	protected readonly errorMessage?: string;
	protected readonly allowPlusAddress: boolean;
	protected readonly allowedDomains?: string[];

	constructor(options: EmailValidatorOptions = {}) {
		super(options);
		this.errorMessage = options.errorMessage;
		this.allowPlusAddress = options.allowPlusAddress !== false;
		this.allowedDomains = options.allowedDomains?.map((d) =>
			d.toLowerCase()
		);
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return validationError([
				{
					code: 'INVALID_STRING',
					message: 'Input must be a string',
				},
			]);
		}

		// Basic email regex, optionally restrict plus addressing
		const plusPart = this.allowPlusAddress ? '+?' : '';
		const localPart = `[A-Za-z0-9._%${plusPart}-]+`;
		const domainPart = '@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}';
		const emailPattern = new RegExp(`^${localPart}${domainPart}$`);

		if (!emailPattern.test(input)) {
			return validationError([
				{
					code: 'STRING_EMAIL_INVALID',
					message:
						this.errorMessage ??
						'Input is not a valid email address',
					context: {
						allowPlusAddress: this.allowPlusAddress,
						allowedDomains: this.allowedDomains,
					},
				},
			]);
		}

		// Check allowed domains if specified
		if (this.allowedDomains) {
			const domain = input.split('@')[1]?.toLowerCase();
			if (!domain || !this.allowedDomains.includes(domain)) {
				return validationError([
					{
						code: 'STRING_EMAIL_DOMAIN_NOT_ALLOWED',
						message:
							this.errorMessage ?? 'Email domain not allowed',
						context: {
							allowedDomains: this.allowedDomains,
							actualDomain: domain,
						},
					},
				]);
			}
		}

		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
