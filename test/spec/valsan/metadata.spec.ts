import 'jasmine';
import {
	AlphaValidator,
	AlphanumericValidator,
	ArrayValSan,
	BearerTokenValSan,
	ComposedValSan,
	DecimalValidator,
	EmailValidator,
	EnumValidator,
	FqdnValSan,
	HexColorValSan,
	IntegerValidator,
	IpAddressValSan,
	Iso8601TimestampValSan,
	JsonValSan,
	LengthValidator,
	LowercaseSanitizer,
	MaxLengthValidator,
	MaxValidator,
	MacAddressValSan,
	MinLengthValidator,
	MinValidator,
	ObjectValSan,
	PatternValidator,
	PortNumberValSan,
	RangeValidator,
	SemverValSan,
	SlugValSan,
	StringToBooleanValSan,
	StringToDateValSan,
	StringToNumberValSan,
	TrimSanitizer,
	UppercaseSanitizer,
	UrlValSan,
	UuidValSan,
	ValSan,
	ValidationResult,
} from '../../../src';
import { TestValSan } from './test-implementations';

class EmptyMetadataValSan extends ValSan<string, string> {
	override rules() {
		return {
			custom: {
				code: 'custom',
				user: {
					helperText: '',
					errorMessage: 'Invalid value',
				},
			},
		};
	}

	protected override async validate(): Promise<ValidationResult> {
		return this.pass();
	}

	protected override async sanitize(input: string): Promise<string> {
		return input;
	}
}

describe('ValSan metadata', () => {
	it(
		'provides optional metadata overrides and preserves Valsan defaults',
		() => {
			const defaults = new MacAddressValSan();
			expect(defaults.getTitle()).toBe('MAC Address');
			expect(defaults.getDescription()).toContain('colon-separated');

			const customized = new MacAddressValSan({
				title: 'Wireless adapter',
				description: 'The MAC address of the Wi-Fi NIC',
			});
			expect(customized.getTitle()).toBe('Wireless adapter');
			expect(customized.getDescription()).toBe(
				'The MAC address of the Wi-Fi NIC'
			);
			expect(new TestValSan().getTitle()).toBe('TestValSan');
			expect(new TestValSan().getDescription()).toBeUndefined();
		}
	);

	it('preserves metadata overrides when copying', () => {
		const original = new MacAddressValSan();
		const copy = original.copy({
			title: 'Network interface address',
			description: 'The MAC address of the Wi-Fi NIC',
		});

		expect(copy.getTitle()).toBe('Network interface address');
		expect(copy.getDescription()).toBe('The MAC address of the Wi-Fi NIC');
		expect(original.getTitle()).toBe('MAC Address');
	});

	it(
		'combines explicit descriptions with rule helper text',
		() => {
			const valSan = new MinValidator({
				min: 4,
				description: 'An item count.',
			});

			expect(valSan.getDescription()).toBe('An item count.');
			expect(valSan.getValidationDescription()).toBe(
				'An item count.\nNumber\nMinimum value: 4'
			);
		}
	);

	it('includes helper text from every composed step', () => {
		const valSan = new ComposedValSan(
			[
				new MinLengthValidator({ minLength: 4 }),
				new MaxLengthValidator({ maxLength: 12 }),
			],
			{ description: 'The person\'s preferred nickname' }
		);

		expect(valSan.getValidationDescription()).toEqual(
			'The person\'s preferred nickname\n' +
			'Minimum length: 4\n' +
			'Maximum length: 12'
		);
	});

	it(
		'uses the merged rules for composed validation descriptions',
		() => {
			const composed = new ComposedValSan([
				new MinLengthValidator({ minLength: 4 }),
				new MinLengthValidator({ minLength: 8 }),
			]);

			expect(composed.getValidationDescription()).toBe(
				'A value that satisfies each configured Valsan ' +
					'step in sequence.\n' +
					'Minimum length: 4'
			);
		}
	);

	it(
		'uses overridden rules for composed validation descriptions',
		() => {
			class CustomComposedValSan extends ComposedValSan<
				string,
				string
			> {
				override rules() {
					return {
						custom: {
							code: 'custom',
							user: {
								helperText: 'A customized composed value',
								errorMessage: 'Invalid customized value',
							},
						},
					};
				}
			}

			const composed = new CustomComposedValSan([
				new MinLengthValidator({ minLength: 4 }),
			]);

			expect(composed.getValidationDescription()).toBe(
				'A value that satisfies each configured Valsan ' +
					'step in sequence.\n' +
					'A customized composed value'
			);
		}
	);

	it('excludes generic type helper text from validation descriptions', () => {
		const valSan = new MinLengthValidator({ minLength: 4 });

		expect(valSan.getValidationDescription()).toBe(
			'A string at least as long as the configured minimum length.\n' +
				'Minimum length: 4'
		);
	});

	it('returns undefined without description or useful helper text', () => {
		expect(new EmptyMetadataValSan().getValidationDescription())
			.toBeUndefined();
	});

	it('includes distinct user and developer helper text', () => {
		const description = new FqdnValSan().getValidationDescription();

		expect(description).toContain('Full domain name');
		expect(description).toContain('Fully Qualified Domain Name (FQDN)');
	});

	it('supports metadata on Object, Array, and Composed Valsans', () => {
		const options = {
			title: 'Container',
			description: 'A documented container',
		};
		const object = new ObjectValSan({
			schema: { value: new TestValSan() },
			...options,
		});
		const array = new ArrayValSan({
			schema: new TestValSan(),
			...options,
		});
		const composed = new ComposedValSan([new TestValSan()], options);

		for (const valSan of [object, array, composed]) {
			expect(valSan.getTitle()).toBe('Container');
			expect(valSan.getDescription()).toBe('A documented container');
		}
	});

	it('provides titles and descriptions for every built-in Valsan', () => {
		const schema = new TestValSan();
		const valsans = [
			new AlphaValidator(),
			new AlphanumericValidator(),
			new ArrayValSan({ schema }),
			new BearerTokenValSan(),
			new ComposedValSan([schema]),
			new DecimalValidator(),
			new EmailValidator(),
			new EnumValidator({ allowedValues: ['one', 'two'] }),
			new FqdnValSan(),
			new HexColorValSan(),
			new IntegerValidator(),
			new IpAddressValSan(),
			new Iso8601TimestampValSan(),
			new JsonValSan(),
			new LengthValidator(),
			new LowercaseSanitizer(),
			new MacAddressValSan(),
			new MaxLengthValidator({ maxLength: 10 }),
			new MaxValidator({ max: 10 }),
			new MinLengthValidator(),
			new MinValidator({ min: 0 }),
			new ObjectValSan({ schema: { value: schema } }),
			new PatternValidator({ pattern: /^value$/ }),
			new PortNumberValSan(),
			new RangeValidator({ min: 0, max: 10 }),
			new SemverValSan(),
			new SlugValSan(),
			new StringToBooleanValSan(),
			new StringToDateValSan(),
			new StringToNumberValSan(),
			new TrimSanitizer(),
			new UppercaseSanitizer(),
			new UrlValSan(),
			new UuidValSan(),
		];

		for (const valSan of valsans) {
			expect(valSan.getTitle()).withContext(valSan.constructor.name)
				.toBeTruthy();
			expect(valSan.getDescription())
				.withContext(valSan.constructor.name)
				.toBeTruthy();
		}
	});
});
