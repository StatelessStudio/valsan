import {
	ValSan,
	ValSanOptions,
	SanitizeResult,
	ValidationError,
	RunsLikeAValSan,
} from '../../valsan';
import { ValSanTypes } from '../../types/types';
import { requiredRule } from '../../rules';

export type ObjectSchema = Record<string, RunsLikeAValSan<unknown, unknown>>;

export interface ObjectValSanOptions extends ValSanOptions {
	/**
	 * Schema defining the structure of the nested object.
	 */
	schema: ObjectSchema;

	/**
	 * Allow additional properties not defined in the schema.
	 * @default false
	 */
	allowAdditionalProperties?: boolean;
}

/**
 * Validates and sanitizes nested objects.
 *
 * @example
 * ```typescript
 * const addressSchema = new ObjectValSan({
 *   schema: {
 *     street: new TrimSanitizer(),
 *     city: new TrimSanitizer(),
 *     zipCode: new PatternValidator({ pattern: /^\d{5}$/ })
 *   }
 * });
 *
 * const userSchema = new ObjectValSan({
 *   schema: {
 *     name: new TrimSanitizer(),
 *     email: new EmailValidator(),
 *     address: addressSchema // Nested object
 *   }
 * });
 * ```
 */
export class ObjectValSan extends ValSan<
	Record<string, unknown>,
	Record<string, unknown>
> {
	override type: ValSanTypes = 'object';

	public get schema(): ObjectSchema {
		return (this.options as ObjectValSanOptions).schema;
	}

	constructor(options: ObjectValSanOptions) {
		super(options);
	}

	public override rules() {
		return {
			object: {
				code: 'object',
				user: {
					helperText: 'Must be a valid object',
					errorMessage: 'Value must be a valid object',
				},
			},
		};
	}

	public override async run(
		input: Record<string, unknown>
	): Promise<SanitizeResult<Record<string, unknown>>> {
		const options = this.options as ObjectValSanOptions;
		if (input === undefined || input === null) {
			if (options.isOptional) {
				return {
					success: true,
					data: undefined,
					errors: [],
				};
			}
			else {
				return {
					success: false,
					errors: [
						{
							code: requiredRule.code,
							message: requiredRule.user.errorMessage,
						},
					],
				};
			}
		}

		if (
			typeof input !== 'object' ||
			input === null ||
			Array.isArray(input)
		) {
			return {
				success: false,
				errors: [
					{
						code: 'object',
						message: 'Value must be a valid object',
					},
				],
			};
		}

		const errors: ValidationError[] = [];
		const schema = options.schema;

		for (const key of Object.keys(schema)) {
			const validator = schema[key];
			const value = input[key];
			const result = await validator.run(value);

			if (result.success) {
				input[key] = result.data;
			}
			else {
				errors.push(
					...result.errors.map((err: ValidationError) => ({
						...err,
						field: err.field ? `${key}.${err.field}` : key,
					}))
				);
			}
		}

		if (!(this.options as ObjectValSanOptions).allowAdditionalProperties) {
			for (const key of Object.keys(input)) {
				if (!(key in schema)) {
					errors.push({
						field: key,
						code: 'unexpected_field',
						message: 'Unexpected field',
					});
				}
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
			data: input,
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
	protected override async sanitize(): Promise<Record<string, unknown>> {
		return {};
	}
}
