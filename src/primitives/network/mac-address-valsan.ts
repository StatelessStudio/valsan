import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

// Accepts formats: 00:1A:2B:3C:4D:5E, 00-1A-2B-3C-4D-5E, 001A.2B3C.4D5E
const macRegex =
	// eslint-disable-next-line max-len
	/^([0-9A-Fa-f]{2}([-:])){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4})$/;

export class MacAddressValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override example = '00:1A:2B:3C:4D:5E';

	override rules() {
		return {
			string: stringRule,
			mac: {
				code: 'mac_address',
				user: {
					helperText: 'MAC address',
					errorMessage: 'Invalid MAC address format',
				},
			},
		};
	}

	protected override async normalize(input: string): Promise<string> {
		return input?.trim();
	}

	protected async validate(input: string): Promise<ValidationResult> {
		if (!isString(input)) {
			return this.fail([this.rules().string]);
		}

		if (!macRegex.test(input)) {
			return this.fail([this.rules().mac]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
