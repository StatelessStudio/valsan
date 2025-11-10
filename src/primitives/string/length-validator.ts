import { ComposedValSan, ComposedValSanOptions } from '../../valsan-composed';
import {
	MinLengthValidator,
	MinLengthValidatorOptions,
} from './min-length-validator';
import { MaxLengthValidator } from './max-length-validator';

export interface LengthValidatorOptions
	extends ComposedValSanOptions,
		MinLengthValidatorOptions {
	maxLength?: number;
}

/**
 * Validates that a string's length is between min and max (inclusive).
 *
 * Does not modify the input string.
 *
 * @example
 * ```typescript
 * const validator = new LengthValidator({ minLength: 3, maxLength: 10 });
 * const result = await validator.run('ab');
 * // result.success === false
 * // result.errors[0].code === 'STRING_TOO_SHORT'
 * ```
 *
 * @example Valid input
 * ```typescript
 * const validator = new LengthValidator({ minLength: 3, maxLength: 10 });
 * const result = await validator.run('abc');
 * // result.success === true, result.data === 'abc'
 * ```
 *
 * @example Too long
 * ```typescript
 * const validator = new LengthValidator({ minLength: 3, maxLength: 5 });
 * const result = await validator.run('toolongstring');
 * // result.success === false
 * // result.errors[0].code === 'STRING_TOO_LONG'
 * ```
 */
export class LengthValidator extends ComposedValSan<string, string> {
	constructor(options: LengthValidatorOptions = {}) {
		const steps = [
			new MinLengthValidator({ minLength: options.minLength ?? 1 }),
			new MaxLengthValidator({
				maxLength: options.maxLength ?? Infinity,
			}),
		];

		super(steps, options);
	}
}
