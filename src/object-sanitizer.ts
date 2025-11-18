import { ObjectSchema, ObjectValSan } from './primitives/object/object-valsan';
import { SanitizeResult, ValidationError } from './valsan';

/**
 * @deprecated Use ObjectValSan instead.
 */
export interface ObjectSanitizationResult {
	success: boolean;
	data?: Record<string, unknown>;
	errors: ValidationError[];
	fieldResults: Record<string, SanitizeResult<unknown>>;
}

/**
 * Validates an object's properties using a schema of valsan validators.
 *
 * @deprecated Use ObjectValSan instead.
 */
export class ObjectSanitizer {
	public readonly schema: ObjectSchema;
	protected valsan: ObjectValSan;

	constructor(schema: ObjectSchema, allowAdditionalProperties = true) {
		this.schema = schema;
		this.valsan = new ObjectValSan({
			schema: this.schema,
			allowAdditionalProperties,
		});
	}

	async run(
		input: Record<string, unknown>
	): Promise<ObjectSanitizationResult> {
		const result = await this.valsan.run(input);

		return {
			success: result.success,
			data: result.data,
			errors: result.errors,
			fieldResults: {},
		};
	}
}

/**
 * @deprecated Use ObjectValSan instead.
 */
export { ObjectSchema } from './primitives/object/object-valsan';
