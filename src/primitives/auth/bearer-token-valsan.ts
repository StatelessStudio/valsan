import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringNotEmptyRule, stringRule } from '../string/string-rules';

/**
 * Validates that a string is a valid HTTP Bearer token (RFC 6750).
 *
 * A Bearer token must be a non-empty string,typically used in
 *  Authorization headers.
 *
 * @example
 * ```typescript
 * const validator = new BearerTokenValSan();
 * const result = await validator.run('mF_9.B5f-4.1JqM');
 * // result.success === true
 * // result.data === 'mF_9.B5f-4.1JqM'
 * ```
 *
 * @example Invalid input
 * ```typescript
 * const validator = new BearerTokenValSan();
 * const result = await validator.run('Bearer ');
 * // result.success === false
 * // result.errors[0].code === 'valid_bearer_token'
 * ```
 */
export class BearerTokenValSan extends ValSan<
	string | string[] | undefined,
	string
> {
	override type: ValSanTypes = 'string';
	override example = 'Bearer mF_9.B5f-4.1JqM';

	override rules() {
		return {
			string: stringRule,
			stringNotEmpty: stringNotEmptyRule,
			bearerPrefix: {
				code: 'bearer_prefix',
				user: {
					helperText: 'Login token',
					errorMessage: 'Missing login token',
				},
				dev: {
					helperText: 'Starts with "Bearer "',
					errorMessage: 'Value must start with "Bearer "',
				},
			},
			bearerToken: {
				code: 'valid_bearer_token',
				user: {
					helperText: 'Login token',
					errorMessage: 'Invalid login token',
				},
				dev: {
					helperText: 'Valid Bearer token',
					errorMessage: 'Invalid Bearer token',
				},
			},
		};
	}

	override async normalize(
		input: string | string[] | undefined
	): Promise<string | undefined> {
		if (typeof input === 'string') {
			return input?.trim();
		}
		else {
			return undefined;
		}
	}

	async validate(input: string | undefined): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (!input) {
			return this.fail([this.rules().stringNotEmpty]);
		}

		if (!input.startsWith('Bearer ')) {
			return this.fail([this.rules().bearerPrefix]);
		}

		input = input.slice(7).trim();

		// RFC 6750: Bearer tokens are usually base64url or JWT,
		//  but allow any visible ASCII except space
		const valid = /^[\x21-\x7E]+$/.test(input);
		if (!valid) {
			return this.fail([this.rules().bearerToken]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		return input.slice(7).trim();
	}
}
