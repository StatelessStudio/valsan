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

export abstract class ValSan<TInput = unknown, TOutput = TInput> {
	/**
	 * Optional normalization step applied before validation.
	 */
	async normalize(input: TInput): Promise<TInput> {
		return input;
	}

	abstract validate(input: TInput): Promise<ValidationResult>;
	abstract sanitize(input: TInput): Promise<TOutput>;

	async run(input: TInput): Promise<SanitizeResult<TOutput>> {
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
