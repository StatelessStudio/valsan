import { ObjectSanitizer, ObjectSchema } from '../../../src';
import { EmailValidator } from '../../../src/primitives/person/email-validator';
// eslint-disable-next-line max-len
import { MinLengthValidator } from '../../../src/primitives/string/min-length-validator';

describe('ObjectSanitizer', () => {
	it('validates a User object with email and username', async () => {
		const schema: ObjectSchema = {
			email: new EmailValidator(),
			username: new MinLengthValidator({ minLength: 3 }),
		};

		const validator = new ObjectSanitizer(schema);
		const input = { email: 'test@example.com', username: 'user123' };
		const result = await validator.run(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);

		for (const key of Object.keys(schema)) {
			expect(result.fieldResults[key].success).toBe(true);
		}
	});

	it('returns errors for invalid properties', async () => {
		const schema: ObjectSchema = {
			email: new EmailValidator(),
			username: new MinLengthValidator({ minLength: 5 }),
		};

		const validator = new ObjectSanitizer(schema);
		const input = { email: 'bad', username: 'ab' };
		const result = await validator.run(input);

		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);

		// Each field should have failed
		for (const key of Object.keys(schema)) {
			expect(result.fieldResults[key].success).toBe(false);
		}
	});
});
