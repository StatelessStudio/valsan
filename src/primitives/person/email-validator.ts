import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';
import { isFqdn } from '../network/is-fqdn';

// This validator supports an ASCII subset, so character counts equal octets.
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;

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
export class EmailValidator extends ValSan<string, string> {
	public override get jsonSchemaPreservesInput(): boolean {
		return true;
	}

	protected override jsonSchemaDefinition() {
		if (!this.allowPlusAddress || this.allowedDomains !== undefined) {
			throw new TypeError(
				'Restricted email validators require options.jsonSchema'
			);
		}

		return {
			type: 'string', format: 'email', maxLength: MAX_EMAIL_LENGTH,
		};
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
