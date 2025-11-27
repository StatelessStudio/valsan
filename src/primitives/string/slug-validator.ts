import { ValSan, ValidationResult, ValSanOptions } from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { isString } from './is-string';
import { stringRule } from './string-rules';

export interface SlugValSanOptions extends ValSanOptions {
	/**
	 * Whether to automatically convert the string to a valid slug.
	 * If true, sanitize will convert the input to lowercase and
	 * replace spaces/underscores with hyphens.
	 * @default false
	 */
	autoConvert?: boolean;
}

/**
 * Validates and sanitizes strings to slug format.
 * A slug contains only lowercase letters, numbers, and hyphens.
 * Underscores are treated as invalid unless autoConvert is enabled.
 *
 * Valid format: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 * - Starts with alphanumeric
 * - Can contain hyphens between alphanumeric groups
 * - No leading/trailing/consecutive hyphens
 *
 * @example
 * ```typescript
 * const validator = new SlugValSan();
 * const result = await validator.run('hello-world');
 * // result.success === true
 * // result.data === 'hello-world'
 *
 * const fail = await validator.run('Hello World');
 * // fail.success === false
 * // fail.errors[0].code === 'slug'
 *
 * // Auto-convert to slug
 * const autoValidator = new SlugValSan({ autoConvert: true });
 * const result2 = await autoValidator.run('Hello World');
 * // result2.success === true
 * // result2.data === 'hello-world'
 *
 * const result3 = await autoValidator.run('hello_world');
 * // result3.success === true
 * // result3.data === 'hello-world'
 * ```
 */
export class SlugValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override example = 'hello-world';

	private readonly autoConvert: boolean;

	constructor(options?: SlugValSanOptions) {
		super(options);
		this.autoConvert = options?.autoConvert ?? false;
	}

	override rules() {
		const helperMsg = 'Slug format (lowercase, alphanumeric, hyphens)';
		const errorMsg =
			'Value is not a valid slug format ' +
			'(only lowercase letters, numbers, and hyphens allowed)';

		return {
			string: stringRule,
			slug: {
				code: 'slug',
				user: {
					helperText: helperMsg,
					errorMessage: errorMsg,
				},
			},
		};
	}

	async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

		// If autoConvert is enabled, we allow any string (will be converted)
		if (this.autoConvert) {
			return this.pass();
		}

		// Otherwise, validate that it's already a proper slug
		if (!slugPattern.test(input)) {
			return this.fail([this.rules().slug]);
		}

		return this.pass();
	}

	async sanitize(input: string): Promise<string> {
		if (!this.autoConvert) {
			return input;
		}

		return (
			input
				// Convert to lowercase
				.toLowerCase()
				// Replace spaces and underscores with hyphens
				.replace(/[\s_]+/g, '-')
				// Remove any character that's not alphanumeric or hyphen
				.replace(/[^a-z0-9-]/g, '')
				// Replace multiple consecutive hyphens with single hyphen
				.replace(/-+/g, '-')
				// Remove leading/trailing hyphens
				.replace(/^-+|-+$/g, '')
		);
	}
}
