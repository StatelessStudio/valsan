import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isNumeric } from '../number/is-numeric';
import { numberRule } from '../number/number-rules';

export class PortNumberValSan extends ValSan<number | string, number> {
	override type: ValSanTypes = 'number';
	override example = '8080';

	override rules() {
		return {
			number: numberRule,
			port_number: {
				code: 'port_number',
				user: {
					helperText: 'Port number',
					errorMessage: 'Port number must be between 0 and 65535',
				},
			},
		};
	}

	protected override async normalize(
		input: string | number
	): Promise<number> {
		if (typeof input === 'string') {
			const trimmed = input.trim();
			const num = Number(trimmed);

			return num;
		}

		return input;
	}

	protected async validate(input: number): Promise<ValidationResult> {
		if (!isNumeric(input)) {
			return this.fail([this.rules().number]);
		}

		if (!Number.isInteger(input) || input < 0 || input > 65535) {
			return this.fail([this.rules().port_number]);
		}

		return this.pass();
	}

	protected async sanitize(input: number): Promise<number> {
		return input;
	}
}
