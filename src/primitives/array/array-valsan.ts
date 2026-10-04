import {
	ValSan,
	ValSanOptions,
	SanitizeResult,
	ValidationError,
	RunsLikeAValSan,
} from '../../valsan';
import { ValSanTypes } from '../../types/types';

export type ArraySchema = RunsLikeAValSan<unknown, unknown>;

export interface ArrayValSanOptions extends ValSanOptions {
	/**
	 * Schema defining the structure of array elements.
	 */
	schema: ArraySchema;
}

/**
 * Validates and sanitizes arrays.
 *
 * @example
 * ```typescript
 * const emailListValSan = new ArrayValSan({
 *   schema: new EmailValidator(),
 * });
 *
 * const result = await emailListValSan.run([
 *   'user1@example.com',
 *   'user2@example.com'
 * ]);
 * ```
 */
export class ArrayValSan extends ValSan<unknown[], unknown[]> {
	override type: ValSanTypes = 'array';

	public get schema(): ArraySchema {
		return (this.options as ArrayValSanOptions).schema;
	}

	constructor(options: ArrayValSanOptions) {
		super(options);
	}

	public override rules() {
		return {
			array: {
				code: 'array',
				user: {
					helperText: 'Must be a valid array',
					errorMessage: 'Value must be a valid array',
				},
			},
		};
	}

	public override async run(
		input: unknown[] | unknown
	): Promise<SanitizeResult<unknown[]>> {
		const options = this.options as ArrayValSanOptions;
		if (input === undefined || input === null) {
			return this.checkRequired(input);
		}

		if (!Array.isArray(input)) {
			return {
				success: false,
				errors: [
					{
						code: 'array',
						message: 'Value must be a valid array',
					},
				],
			};
		}

		const errors: ValidationError[] = [];
		const schema = options.schema;
		const result: unknown[] = [];

		// Validate and sanitize each item
		for (let i = 0; i < input.length; i++) {
			const value = input[i];
			const itemResult = await schema.run(value);

			if (itemResult.success) {
				result.push(itemResult.data);
			}
			else {
				errors.push(
					...itemResult.errors.map((err: ValidationError) =>
						this.validationError(err, i)
					)
				);
			}
		}

		if (errors.length > 0) {
			return {
				success: false,
				errors,
			};
		}

		return {
			success: true,
			data: result,
			errors: [],
		};
	}

	/**
	 * Unused - validation is handled in run()
	 */
	protected override async validate() {
		return this.pass();
	}

	/**
	 * Unused - sanitization is handled in run()
	 */
	protected override async sanitize(): Promise<unknown[]> {
		return [];
	}
}
