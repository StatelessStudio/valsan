import { RuleSet } from './rules/rule';
import { ValSanTypes } from './types/types';
import {
	RunsLikeAValSan as RunsLikeAValSan,
	SanitizeResult,
	ValSanOptions,
} from './valsan';

export interface ComposedValSanOptions extends ValSanOptions {
	/**
	 * If true, undefined and null values will pass validation without
	 * running validation or sanitization steps.
	 * @default false
	 */
	isOptional?: boolean;
}

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
	public type: ValSanTypes = 'unknown';

	/**
	 * Creates a composed validator from an array of ValSan steps.
	 *
	 * @param steps - Array of ValSan instances to compose.
	 * Must have at least one step.
	 * @param options - Optional configuration for the composed validator.
	 */
	constructor(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		public readonly steps: RunsLikeAValSan<any, any>[],
		public readonly options: ComposedValSanOptions = {}
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

	public rules(): RuleSet {
		const combinedRules: RuleSet = {};

		for (const step of this.steps) {
			const stepRules = step.rules();

			for (const [key, rule] of Object.entries(stepRules)) {
				if (!(key in combinedRules)) {
					combinedRules[key] = rule;
				}
			}
		}

		return combinedRules;
	}

	async run(input: TInput): Promise<SanitizeResult<TOutput>> {
		// Handle optional fields
		const isOptional = this.options.isOptional;
		if (isOptional && (input === undefined || input === null)) {
			return {
				success: true,
				data: input as unknown as TOutput,
				errors: [],
			};
		}

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
