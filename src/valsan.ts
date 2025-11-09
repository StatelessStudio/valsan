export interface ValidationError {
	field?: string;
	code: string;
	message: string;
	context?: Record<string, unknown>;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export interface SanitizeResult<T> {
	success: boolean;
	data?: T;
	errors: ValidationError[];
}

export interface ValSanOptions {
	/**
	 * If true, undefined and null values will pass validation without
	 * running validation or sanitization steps.
	 * @default false
	 */
	isOptional?: boolean;
}

export interface RunsLikeAValSan<TInput = unknown, TOutput = TInput> {
	run(input: TInput): Promise<SanitizeResult<TOutput>>;
}

export abstract class ValSan<TInput = unknown, TOutput = TInput>
implements RunsLikeAValSan<TInput, TOutput> {
	public constructor(protected readonly options: ValSanOptions = {}) {}

	/**
	 * Optional normalization step applied before validation.
	 */
	protected async normalize(input: TInput): Promise<TInput> {
		return input;
	}

	protected abstract validate(input: TInput): Promise<ValidationResult>;
	protected abstract sanitize(input: TInput): Promise<TOutput>;

	public async run(input: TInput): Promise<SanitizeResult<TOutput>> {
		// Handle optional fields
		const isOptional = this.options.isOptional;
		if (isOptional && (input === undefined || input === null)) {
			return {
				success: true,
				data: input as unknown as TOutput,
				errors: [],
			};
		}

		// Apply normalization before validation
		const normalized = await this.normalize(input);
		const validation = await this.validate(normalized);

		if (!validation.isValid) {
			return {
				success: false,
				errors: validation.errors,
			};
		}

		try {
			const data = await this.sanitize(normalized);
			return {
				success: true,
				data,
				errors: [],
			};
		}
		catch (error) {
			const message =
				error instanceof Error ? error.message : 'Sanitization failed';
			return {
				success: false,
				errors: [
					{
						code: 'SANITIZE_ERROR',
						message,
					},
				],
			};
		}
	}
}
