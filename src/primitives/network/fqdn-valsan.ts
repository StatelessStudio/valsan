import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';
import { isFqdn } from './is-fqdn';

export class FqdnValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override title = 'Fully qualified domain name';
	override description = 'A fully qualified domain name (FQDN).';
	override format = 'hostname';
	override example = 'host.example.com';

	override rules() {
		return {
			string: stringRule,
			fqdn: {
				code: 'fqdn',
				user: {
					helperText: 'Full domain name',
					errorMessage: 'Input must be a valid domain name',
				},
				dev: {
					helperText: 'Fully Qualified Domain Name (FQDN)',
					errorMessage: 'Input must be a valid FQDN',
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

		if (!isFqdn(input)) {
			return this.fail([this.rules().fqdn]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
