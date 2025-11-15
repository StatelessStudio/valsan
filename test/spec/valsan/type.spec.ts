import 'jasmine';
import {
	LowercaseSanitizer,
	UppercaseSanitizer,
	TrimSanitizer,
	PatternValidator,
	MinLengthValidator,
	MaxLengthValidator,
	LengthValidator,
	AlphanumericValidator,
	EmailValidator,
} from '../../../src';

import { IntegerValidator, StringToNumberValSan } from '../../../src';
import { EnumValidator } from '../../../src/primitives/utility/enum-validator';

describe('ValSan type property', () => {
	it('string sanitizers/validators should report type = "string"', () => {
		expect(new LowercaseSanitizer().type).toBe('string');
		expect(new UppercaseSanitizer().type).toBe('string');
		expect(new TrimSanitizer().type).toBe('string');
		expect(new PatternValidator({ pattern: /^a$/ }).type).toBe('string');
		expect(new MinLengthValidator({ minLength: 1 }).type).toBe('string');
		expect(new MaxLengthValidator({ maxLength: 10 }).type).toBe('string');
		expect(new LengthValidator({ minLength: 1, maxLength: 5 }).type).toBe(
			'string'
		);
		expect(new AlphanumericValidator().type).toBe('string');
		expect(new EmailValidator().type).toBe('string');
	});

	it('number validators should report type = "number"', () => {
		expect(new IntegerValidator().type).toBe('integer');
		expect(new StringToNumberValSan().type).toBe('number');
	});

	it('EnumValidator should default to unknown', () => {
		const ev = new EnumValidator<number>({
			allowedValues: [1, 2, 3],
		});
		expect(ev.type).toBe('unknown');
	});
});
