import { ValSan, ValidationResult } from '../../valsan';
import { validationError, validationSuccess } from '../../errors';
import { isString } from '../string/is-string';

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
 * // result.errors[0].code === 'INVALID_BEARER_TOKEN'
 * ```
 */
export class BearerTokenValSan extends ValSan<
	string | string[] | undefined,
	string
> {
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
			return validationError([
				{
					code: 'INVALID_BEARER_TOKEN',
					message: 'Token must be a string',
				},
			]);
		}

		if (!input) {
			return validationError([
				{
					code: 'INVALID_BEARER_TOKEN',
					message: 'Token must not be empty',
				},
			]);
		}

		if (!input.startsWith('Bearer ')) {
			return validationError([
				{
					code: 'INVALID_BEARER_TOKEN',
					message: 'Token must contain Bearer prefix and token',
				},
			]);
		}

		input = input.slice(7).trim();

		// RFC 6750: Bearer tokens are usually base64url or JWT,
		//  but allow any visible ASCII except space
		const valid = /^[\x21-\x7E]+$/.test(input);
		if (!valid) {
			return validationError([
				{
					code: 'INVALID_BEARER_TOKEN',
					message: 'Token contains invalid characters',
				},
			]);
		}

		return validationSuccess();
	}

	async sanitize(input: string): Promise<string> {
		return input.slice(7).trim();
	}
}
