import { ValSanTypes } from './types/types';
import { RuleSet } from './rules/rule';
import { SanitizeResult, ValSanOptions } from './valsan';

export class BaseValSan<TInput = unknown, TOutput = TInput> {
	public type: ValSanTypes = 'unknown';
	protected title: string | undefined = undefined;
	protected description: string | undefined = undefined;
	public example = '';
	public format?: string;

	public options: ValSanOptions;

	public getTitle(): string {
		return this.options?.title ?? this.title ?? this.constructor.name;
	}

	public getDescription(): string | undefined {
		return this.options?.description ?? this.description ?? undefined;
	}

	protected buildValidationDescription(
		supplementalDescriptions: readonly (string | undefined)[]
	): string | undefined {
		const descriptions = [
			this.getDescription(),
			...supplementalDescriptions,
		]
			.map((description) => description?.trim())
			.filter(
				(description): description is string => Boolean(description)
			);
		const uniqueDescriptions = [...new Set(descriptions)];

		return uniqueDescriptions.length > 0
			? uniqueDescriptions.join('\n')
			: undefined;
	}

	protected collectRuleHelperTexts(rules: RuleSet): string[] {
		const ignoreRuleKeys = new Set([
			'string'
		]);

		return Object.entries(rules).flatMap(([key, rule]) => {
			if (ignoreRuleKeys.has(key)) {
				return [];
			}

			return [rule.user.helperText, rule.dev?.helperText].filter(
				(helperText): helperText is string => Boolean(helperText)
			);
		});
	}

	public checkRequired(input: unknown): SanitizeResult<TOutput> {
		const isNullable =
			this.options.isNullable ?? this.options.isOptional ?? false;
		const isUndefinable =
			this.options.isUndefinable ?? this.options.isOptional ?? false;
		let isAllowed = this.options.isOptional ?? false;

		if (input === null) {
			isAllowed = isNullable;
		}
		else if (input === undefined) {
			isAllowed = isUndefinable;
		}

		if (isAllowed) {
			return {
				success: true,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				data: input as any,
				errors: [],
			};
		}
		else {
			return {
				success: false,
				errors: [
					{
						code: 'required',
						message: 'Value is required',
					},
				],
			};
		}
	}
}
