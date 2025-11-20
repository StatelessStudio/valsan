import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

// UUID v1, v3, v4, and v5 regex pattern
// Matches: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (case-insensitive)
const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UuidValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override format = 'uuid';
	override example = '550e8400-e29b-41d4-a716-446655440000';

	override rules() {
		return {
			string: stringRule,
			uuid: {
				code: 'uuid',
				user: {
					helperText: 'Unique identifier',
					errorMessage: 'Input must be a valid id',
				},
				dev: {
					helperText: 'UUID (Universally Unique Identifier)',
					errorMessage:
						'Input must be a valid UUID format (v1, v3, v4, or v5)',
				},
			},
		};
	}

	protected override async normalize(input: string): Promise<string> {
		return typeof input === 'string' ? input.trim().toLowerCase() : input;
	}

	protected async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (!uuidRegex.test(input)) {
			return this.fail([this.rules().uuid]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
