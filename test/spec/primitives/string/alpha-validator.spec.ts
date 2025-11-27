import 'jasmine';
import { AlphaValidator } from '../../../../src/primitives/string';

describe('AlphaValidator', () => {
	const validator = new AlphaValidator();

	it('should succeed for alphabetic strings', async () => {
		const validInputs = ['hello', 'Hello', 'HELLO', 'abc', 'ABC', 'abcDEF'];
		for (const input of validInputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(true);
			expect(result.errors.length).toBe(0);
			if (result.success) {
				expect(result.data).toBe(input);
			}
		}
	});

	it('should fail for strings with numbers', async () => {
		const invalidInputs = ['abc123', 'hello1', 'test2'];
		for (const input of invalidInputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('alpha');
			}
		}
	});

	it('should fail for strings with special characters', async () => {
		const invalidInputs = ['hello-world', 'test_case', 'abc!', '@test'];
		for (const input of invalidInputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('alpha');
			}
		}
	});

	it('should fail for strings with spaces when not allowed', async () => {
		const invalidInputs = ['hello world', 'test case'];
		for (const input of invalidInputs) {
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('alpha');
			}
		}
	});

	it('should fail for empty string', async () => {
		const result = await validator.run('');
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors[0].code).toBe('alpha');
		}
	});

	it('should fail for non-string values', async () => {
		const invalidInputs = [123, null, undefined, {}];
		for (const input of invalidInputs) {
			// @ts-expect-error: testing invalid input types
			const result = await validator.run(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				// null and undefined return 'required'
				const expectedCode =
					input === null || input === undefined
						? 'required'
						: 'string';
				expect(result.errors[0].code).toBe(expectedCode);
			}
		}
	});

	describe('with allowSpaces option', () => {
		const validatorWithSpaces = new AlphaValidator({
			allowSpaces: true,
		});

		it(
			'should succeed for alphabetic strings with spaces ' +
				'when allowed',
			async () => {
				const validInputs = [
					'hello world',
					'Hello World',
					'test case one',
					'hello',
					'a b c',
					'  multiple   spaces  ',
				];
				for (const input of validInputs) {
					const result = await validatorWithSpaces.run(input);
					expect(result.success).toBe(true);
					expect(result.errors.length).toBe(0);
					if (result.success) {
						expect(result.data).toBe(input);
					}
				}
			}
		);

		it('should fail strings with numbers (w/ allowSpaces)', async () => {
			const invalidInputs = ['hello world 123', 'test 1'];
			for (const input of invalidInputs) {
				const result = await validatorWithSpaces.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('alpha');
				}
			}
		});

		it(
			'should fail for strings with special characters ' +
				'when allowSpaces is true',
			async () => {
				const invalidInputs = ['hello-world', 'test_case', 'foo@bar'];
				for (const input of invalidInputs) {
					const result = await validatorWithSpaces.run(input);
					expect(result.success).toBe(false);
					if (!result.success) {
						expect(result.errors[0].code).toBe('alpha');
					}
				}
			}
		);
	});
});
