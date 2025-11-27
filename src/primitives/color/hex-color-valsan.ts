import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

// Hex color regex supporting 3, 4, 6, and 8 digit formats
// Formats: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
// eslint-disable-next-line max-len
const hexColorRegex =
	/^#(?:[0-9A-Fa-f]{3}(?:[0-9A-Fa-f])?|[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?)$/;

export class HexColorValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override format = 'color-hex';
	override example = '#FF0000';

	override rules() {
		return {
			string: stringRule,
			hexColor: {
				code: 'hex_color',
				user: {
					helperText: 'Color in hex format',
					errorMessage: 'Input must be a valid hex color',
				},
				dev: {
					helperText: 'Hexadecimal color code',
					errorMessage: 'Input must be valid hex color format',
				},
			},
		};
	}

	protected override async normalize(input: string): Promise<string> {
		if (typeof input === 'string') {
			return input.trim().toUpperCase();
		}

		return input;
	}

	protected async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (!hexColorRegex.test(input)) {
			return this.fail([this.rules().hexColor]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
