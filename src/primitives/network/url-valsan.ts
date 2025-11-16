import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { stringRule } from '../string';
import { isString } from '../string/is-string';

export class UrlValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override format = 'uri';
	override example = 'https://example.com';

	override rules() {
		return {
			string: stringRule,
			url: {
				code: 'url',
				user: {
					helperText: 'URL',
					errorMessage: 'Invalid URL format',
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
			// URL constructor throws on invalid URLs
			new URL(input);
		}
		catch {
			return this.fail([this.rules().url]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
