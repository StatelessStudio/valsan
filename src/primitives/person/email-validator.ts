import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

export interface EmailValidatorOptions extends ValSanOptions {
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
	override type: ValSanTypes = 'string';
	override example = 'test@example.com';

	protected readonly allowPlusAddress: boolean;
	protected readonly allowedDomains?: string[];

	override rules() {
		return {
			string: stringRule,
			invalid: {
				code: 'email_format',
				user: {
					helperText: 'Email',
					errorMessage: 'Input is not a valid email address',
				},
				context: {
					allowPlusAddress: this.allowPlusAddress,
				},
			},
			domain: {
				code: 'email_domain',
				user: {
					helperText:
						'Domain must be: ' +
						(this.allowedDomains?.join(', ') ?? ''),
					errorMessage: 'Email domain not allowed',
				},
				context: {
					allowedDomains: this.allowedDomains,
				},
			},
		};
	}

	constructor(options: EmailValidatorOptions = {}) {
		super(options);
		this.allowPlusAddress = options.allowPlusAddress !== false;
		this.allowedDomains = options.allowedDomains?.map((d) =>
			d.toLowerCase()
		);
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		// Basic email regex, optionally restrict plus addressing
		const plusPart = this.allowPlusAddress ? '+?' : '';
		const localPart = `[A-Za-z0-9._%${plusPart}-]+`;
		const domainPart = '@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}';
		const emailPattern = new RegExp(`^${localPart}${domainPart}$`);

		if (!emailPattern.test(input)) {
			return this.fail([this.rules().invalid]);
		}

		// Check allowed domains if specified
		if (this.allowedDomains) {
			const domain = input.split('@')[1]?.toLowerCase();
			if (!domain || !this.allowedDomains.includes(domain)) {
				return this.fail([this.rules().domain]);
			}
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
