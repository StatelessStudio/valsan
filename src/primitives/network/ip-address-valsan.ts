import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

const ipv4Regex =
	// eslint-disable-next-line max-len
	/^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

function isIpv6(input: string): boolean {
	const compressionIndex = input.indexOf('::');
	const hasCompression = compressionIndex !== -1;

	if (
		hasCompression &&
		(input.indexOf('::', compressionIndex + 2) !== -1 ||
			input.includes(':::'))
	) {
		return false;
	}

	const left = hasCompression ? input.slice(0, compressionIndex) : input;
	const right = hasCompression ? input.slice(compressionIndex + 2) : '';
	const groups = [
		...(left ? left.split(':') : []),
		...(hasCompression && right ? right.split(':') : []),
	];
	let groupCount = 0;

	for (let index = 0; index < groups.length; index += 1) {
		const group = groups[index];

		if (group.includes('.')) {
			if (
				index !== groups.length - 1 ||
				!input.endsWith(group) ||
				!ipv4Regex.test(group)
			) {
				return false;
			}

			groupCount += 2;
		}
		else if (/^[\da-fA-F]{1,4}$/.test(group)) {
			groupCount += 1;
		}
		else {
			return false;
		}
	}

	return hasCompression ? groupCount < 8 : groupCount === 8;
}

export class IpAddressValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override title = 'IP address';
	override description = 'A valid IPv4 or IPv6 address.';
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

		if (!(ipv4Regex.test(input) || isIpv6(input))) {
			return this.fail([this.rules().ip_address]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
