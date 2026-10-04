import { ComposedValSan, ComposedValSanOptions } from '../../valsan-composed';
import {
	MinLengthValidator,
	MinLengthValidatorOptions,
} from './min-length-validator';
import { MaxLengthValidator } from './max-length-validator';
import { ValSanTypes } from '../../types/types';
import {
	deriveRuleSchema, JsonSchemaDirection, JsonSchemaOptions,
} from '../../json-schema';

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
 * // result.errors[0].code === 'string_min_len'
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
 * // result.errors[0].code === 'string_max_len'
 * ```
 */
export class LengthValidator<
	const TOptions extends LengthValidatorOptions = Record<string, never>,
> extends ComposedValSan<string, string, TOptions> {
	override type: ValSanTypes = 'string';
	override title = 'String length';
	override description =
		'A string whose length falls within the configured inclusive range.';

	protected override jsonSchemaDefinition(
		direction: JsonSchemaDirection,
		options: JsonSchemaOptions
	) {
		if (!this.jsonSchemaPreservesInput) {
			return super.jsonSchemaDefinition(direction, options);
		}
		if (
			this.steps.length !== 2 ||
			this.steps.some((step, index) =>
				Object.getPrototypeOf(step) !== (
					index === 0 ? MinLengthValidator.prototype :
						MaxLengthValidator.prototype
				) ||
				step.options.jsonSchema?.[direction] !== undefined
			)
		) {
			return super.jsonSchemaDefinition(direction, options);
		}
		return deriveRuleSchema({
			input: this.inputType ?? this.type,
			output: this.outputType ?? this.type,
		}, this.rules(), direction);
	}

	constructor(options: TOptions = {} as TOptions) {
		const steps = [
			new MinLengthValidator({ minLength: options.minLength ?? 1 }),
			new MaxLengthValidator({
				maxLength: options.maxLength ?? Infinity,
			}),
		];

		super(steps, options);
	}
}
