import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

export class JsonValSan extends ValSan<string, unknown> {
	override type: ValSanTypes = 'string';
	override format = 'json';
	override example = '{"key": "value"}';

	override rules() {
		return {
			string: stringRule,
			json: {
				code: 'json',
				user: {
					helperText: 'Valid JSON',
					errorMessage: 'Input must be valid JSON',
				},
				dev: {
					helperText: 'Valid JSON string',
					errorMessage: 'Input must be a valid JSON string',
				},
			},
		};
	}

	protected override async normalize(input: string): Promise<string> {
		return typeof input === 'string' ? input.trim() : input;
	}

	protected async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		try {
			JSON.parse(input);
			return this.pass();
		}
		catch {
			return this.fail([this.rules().json]);
		}
	}

	protected async sanitize(input: string): Promise<unknown> {
		return JSON.parse(input);
	}
}
