import { ValSanTypes } from '../../types/types';
import { ValSan, ValidationResult } from '../../valsan';
import { isString } from '../string/is-string';
import { stringRule } from '../string/string-rules';

// Semantic versioning regex (SemVer 2.0.0)
// Matches: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
const semverRegex =
	// eslint-disable-next-line max-len
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export class SemverValSan extends ValSan<string, string> {
	override type: ValSanTypes = 'string';
	override format = 'semver';
	override example = '1.2.3';

	override rules() {
		return {
			string: stringRule,
			semver: {
				code: 'semver',
				user: {
					helperText: 'Version number',
					errorMessage: 'Input must be a valid semantic version',
				},
				dev: {
					helperText: 'Semantic Version (SemVer 2.0.0)',
					errorMessage: 'Input must be a valid SemVer format',
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

		if (!semverRegex.test(input)) {
			return this.fail([this.rules().semver]);
		}

		return this.pass();
	}

	protected async sanitize(input: string): Promise<string> {
		return input;
	}
}
