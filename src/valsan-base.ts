import { ValSanTypes } from './types/types';
import { SanitizeResult, ValSanOptions } from './valsan';

export class BaseValSan<TInput = unknown, TOutput = TInput> {
	public type: ValSanTypes = 'unknown';
	public example = '';
	public format?: string;

	public options: ValSanOptions;

	public checkRequired(input: unknown): SanitizeResult<TOutput> {
		if (this.options.isOptional) {
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
