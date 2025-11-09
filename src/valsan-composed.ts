import {
	RunsLikeAValSan as RunsLikeAValSan,
	SanitizeResult,
	ValSanOptions,
} from './valsan';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ComposedValSanOptions extends ValSanOptions {}

/**
 * ComposedValSan allows you to compose multiple ValSan instances into a
 * single, reusable validator. This is ideal for building library components
 * like EmailValSan, URLValSan, etc.
 *
 * Each step in the composition runs sequentially, with the output of one
 * becoming the input of the next. If any step fails validation, the entire
 * composition fails.
 *
 * @example
 * ```typescript
 * class EmailValSan extends ComposedValSan<string, string> {
 *   constructor() {
 *     super([
 *       new TrimValSan(),
 *       new LowercaseValSan(),
 *       new EmailFormatValSan()
 *     ]);
 *   }
 * }
 *
 * const validator = new EmailValSan();
 * const result = await validator.run('  USER@EXAMPLE.COM  ');
 * ```
 */
export class ComposedValSan<TInput = unknown, TOutput = TInput>
implements RunsLikeAValSan<TInput, TOutput> {
	/**
	 * Creates a composed validator from an array of ValSan steps.
	 *
	 * @param steps - Array of ValSan instances to compose.
	 * Must have at least one step.
	 * @param options - Optional configuration for the composed validator.
	 */
	constructor(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		protected readonly steps: RunsLikeAValSan<any, any>[],
		protected readonly options: ComposedValSanOptions = {}
	) {
		if (steps.length === 0) {
			throw new Error('ComposedValSan requires at least one step');
		}
	}

	/**
	 * Returns the array of steps in this composition.
	 * Useful for introspection and debugging.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getSteps(): readonly RunsLikeAValSan<any, any>[] {
		return [...this.steps];
	}

	async run(input: TInput): Promise<SanitizeResult<TOutput>> {
		let value: TInput | TOutput = input;

		for (const step of this.steps) {
			const result = await step.run(value);

			if (!result.success) {
				return {
					success: false,
					errors: result.errors,
				};
			}

			// Update value for next step
			value = result.data;
		}

		return {
			success: true,
			data: value as TOutput,
			errors: [],
		};
	}
}
