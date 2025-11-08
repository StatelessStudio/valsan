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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ValSanOptions {}

export abstract class ValSan<TInput = unknown, TOutput = TInput> {
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
