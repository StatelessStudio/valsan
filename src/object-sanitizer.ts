import { SanitizeResult, ValidationError, RunsLikeAValSan } from './valsan';

export type ObjectSchema = Record<string, RunsLikeAValSan<unknown, unknown>>;

export interface ObjectSanitizationResult {
	success: boolean;
	data?: Record<string, unknown>;
	errors: ValidationError[];
	fieldResults: Record<string, SanitizeResult<unknown>>;
}

/**
 * Validates an object's properties using a schema of valsan validators.
 */
export class ObjectSanitizer {
	private readonly schema: ObjectSchema;

	constructor(schema: ObjectSchema) {
		this.schema = schema;
	}

	async run(
		input: Record<string, unknown>
	): Promise<ObjectSanitizationResult> {
		const errors: ValidationError[] = [];
		const data: Record<string, unknown> = {};
		const fieldResults: Record<string, SanitizeResult<unknown>> = {};
		let success = true;

		for (const key of Object.keys(this.schema)) {
			const validator = this.schema[key];
			const value = input[key];
			const result = await validator.run(value);
			fieldResults[key] = result;

			if (result.success) {
				data[key] = result.data;
			}
			else {
				success = false;
				for (const err of result.errors) {
					errors.push({ ...err, field: key });
				}
			}
		}

		return {
			success,
			data: success ? data : undefined,
			errors,
			fieldResults,
		};
	}
}
