import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';
import { isFqdn } from '../network/is-fqdn';
import { MAX_EMAIL_LENGTH, MAX_LOCAL_PART_LENGTH } from './email-limits';
import type { Rule } from '../../rules/rule';

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
	 *  (case-insensitive, no leading @). Values are normalized to lowercase.
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
export class EmailValidator<
	const TOptions extends EmailValidatorOptions = Record<string, never>,
> extends ValSan<string, string, string, TOptions> {
	public override get jsonSchemaPreservesInput(): boolean {
		return true;
	}

	override type: ValSanTypes = 'string';
	override title = 'Email address';
	override description =
		'An email address, optionally restricted to configured domains or ' +
		'excluding plus addressing.';
	override format = 'email';
	override example = 'test@example.com';

	protected readonly allowPlusAddress: boolean;
	protected readonly allowedDomains?: string[];

	override rules(): { string: Rule; invalid: Rule; domain: Rule } {
		return {
			string: stringRule,
			invalid: {
				kind: 'string.email' as const,
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
				kind: 'string.emailDomains' as const,
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

	constructor(options: TOptions = {} as TOptions) {
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

		const addressParts = input.split('@');
		if (
			addressParts.length !== 2 ||
			addressParts[0] === '' ||
			addressParts[1] === ''
		) {
			return this.fail([this.rules().invalid]);
		}

		const [localPartValue, domainValue] = addressParts;

		// Basic email regex, optionally restrict plus addressing
		const plusPart = this.allowPlusAddress ? '+?' : '';
		const localPart = `[A-Za-z0-9._%${plusPart}-]+`;
		const domainPart = '@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}';
		const emailPattern = new RegExp(`^${localPart}${domainPart}$`);

		if (!emailPattern.test(input)) {
			return this.fail([this.rules().invalid]);
		}

		if (
			input.length > MAX_EMAIL_LENGTH ||
			localPartValue.length > MAX_LOCAL_PART_LENGTH ||
			localPartValue.startsWith('.') ||
			localPartValue.endsWith('.') ||
			localPartValue.includes('..') ||
			!isFqdn(domainValue)
		) {
			return this.fail([this.rules().invalid]);
		}

		// Check allowed domains if specified
		if (this.allowedDomains) {
			const normalizedDomain = domainValue.toLowerCase();
			if (!this.allowedDomains.includes(normalizedDomain)) {
				return this.fail([this.rules().domain]);
			}
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input;
	}
}
