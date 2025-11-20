import { SemverValSan } from '../../../../src/primitives';

describe('SemverValSan', () => {
	const validV1 = '1.0.0';
	const validV2 = '2.3.4';
	const validV0 = '0.0.0';
	const validWithPrerelease = '1.0.0-alpha';
	const validWithPrereleaseNum = '1.0.0-alpha.1';
	const validWithBuild = '1.0.0+build.1';
	const validWithBoth = '1.0.0-rc.1+build.123';
	const validComplex = '2.0.0-rc.1+build.123';

	it('accepts valid semantic version 1.0.0', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validV1);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validV1);
	});

	it('accepts valid semantic version 2.3.4', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validV2);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validV2);
	});

	it('accepts valid semantic version 0.0.0', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validV0);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validV0);
	});

	it('accepts version with prerelease identifier', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validWithPrerelease);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validWithPrerelease);
	});

	it('accepts version with prerelease and number', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validWithPrereleaseNum);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validWithPrereleaseNum);
	});

	it('accepts version with build metadata', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validWithBuild);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validWithBuild);
	});

	it('accepts version with both prerelease and build', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validWithBoth);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validWithBoth);
	});

	it('accepts complex version format', async () => {
		const validator = new SemverValSan();
		const result = await validator.run(validComplex);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validComplex);
	});

	it('normalizes by trimming whitespace', async () => {
		const validator = new SemverValSan();
		const input = `  ${validV1}  `;
		const result = await validator.run(input);
		expect(result.success).toBe(true);
		expect(result.data).toBe(validV1);
	});

	it('rejects version with leading zeros', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('01.0.0');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});

	it('rejects version missing patch', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('1.0');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});

	it('rejects version missing minor', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('1');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});

	it('rejects version with leading v', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('v1.0.0');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});

	it('rejects empty string', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});

	it('rejects invalid format with text', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('1.0.0-');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});

	it('rejects version with spaces', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('1 . 0 . 0');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});

	it('rejects non-string input', async () => {
		const validator = new SemverValSan();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(null as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('rejects number input', async () => {
		const validator = new SemverValSan();
		const num: unknown = 123;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(num as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('rejects object input', async () => {
		const validator = new SemverValSan();
		const obj: unknown = { version: '1.0.0' };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(obj as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('accepts multiple prerelease identifiers', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('1.0.0-alpha.beta.1');
		expect(result.success).toBe(true);
		expect(result.data).toBe('1.0.0-alpha.beta.1');
	});

	it('accepts multiple build metadata identifiers', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('1.0.0+20130313144700');
		expect(result.success).toBe(true);
		expect(result.data).toBe('1.0.0+20130313144700');
	});

	it('rejects prerelease with invalid characters', async () => {
		const validator = new SemverValSan();
		const result = await validator.run('1.0.0-alpha!');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('semver');
	});
});
