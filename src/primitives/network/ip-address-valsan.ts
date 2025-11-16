import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

const ipv4Regex =
	// eslint-disable-next-line max-len
	/^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;

export class IpAddressValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override example = '192.168.0.1';

	override rules() {
		return {
			string: stringRule,
			ip_address: {
				code: 'ip_address',
				user: {
					helperText: 'IP address',
					errorMessage: 'Value is not a valid IP address',
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

		if (!(ipv4Regex.test(input) || ipv6Regex.test(input))) {
			return this.fail([this.rules().ip_address]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
