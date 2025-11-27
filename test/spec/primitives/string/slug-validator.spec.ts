import 'jasmine';
import { SlugValSan } from '../../../../src/primitives/string';

describe('SlugValSan', () => {
	const validator = new SlugValSan();

	describe('validation', () => {
		it('should succeed for valid slugs', async () => {
			const validInputs = [
				'hello-world',
				'test-slug',
				'a',
				'abc123',
				'hello-world-123',
				'product-slug-v2',
				'single-word',
			];
			for (const input of validInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(true);
				expect(result.errors.length).toBe(0);
				if (result.success) {
					expect(result.data).toBe(input);
				}
			}
		});

		it('should succeed for single alphanumeric strings', async () => {
			const validInputs = ['hello', 'test', 'a', '123', 'abc123def'];
			for (const input of validInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(true);
				expect(result.data).toBe(input);
			}
		});

		it('should fail for uppercase letters', async () => {
			const invalidInputs = ['Hello-World', 'TEST', 'Hello'];
			for (const input of invalidInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('slug');
				}
			}
		});

		it('should fail for strings with spaces', async () => {
			const invalidInputs = ['hello world', 'test slug', 'a b c'];
			for (const input of invalidInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('slug');
				}
			}
		});

		it('should fail for strings with underscores', async () => {
			const invalidInputs = ['hello_world', 'test_slug', 'a_b_c'];
			for (const input of invalidInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('slug');
				}
			}
		});

		it('should fail for strings with special characters', async () => {
			const invalidInputs = [
				'hello@world',
				'test#slug',
				'hello!',
				'test.slug',
				'hello_world-test',
			];
			for (const input of invalidInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('slug');
				}
			}
		});

		it('should fail for strings with leading hyphens', async () => {
			const invalidInputs = ['-hello', '-hello-world', '--test'];
			for (const input of invalidInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('slug');
				}
			}
		});

		it('should fail for strings with trailing hyphens', async () => {
			const invalidInputs = ['hello-', 'hello-world-', 'test--'];
			for (const input of invalidInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('slug');
				}
			}
		});

		it('should fail for strings with consecutive hyphens', async () => {
			const invalidInputs = [
				'hello--world',
				'test---slug',
				'a--b',
				'hello-world--test',
			];
			for (const input of invalidInputs) {
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.errors[0].code).toBe('slug');
				}
			}
		});

		it('should fail for empty string', async () => {
			const result = await validator.run('');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('slug');
			}
		});

		it('should fail for non-string values', async () => {
			const invalidInputs = [123, null, undefined, {}];
			for (const input of invalidInputs) {
				// @ts-expect-error: testing invalid input types
				const result = await validator.run(input);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expectedCode =
						input === null || input === undefined
							? 'required'
							: 'string';
					expect(result.errors[0].code).toBe(expectedCode);
				}
			}
		});
	});

	describe('with autoConvert option', () => {
		const autoValidator = new SlugValSan({ autoConvert: true });

		it('should convert to slug format', async () => {
			const inputs = [
				{ input: 'Hello World', expected: 'hello-world' },
				{ input: 'HELLO_WORLD', expected: 'hello-world' },
				{ input: 'Test Slug 123', expected: 'test-slug-123' },
				{ input: 'hello_world_test', expected: 'hello-world-test' },
				{ input: '  hello  world  ', expected: 'hello-world' },
				{ input: 'hello---world', expected: 'hello-world' },
				{ input: '-hello-world-', expected: 'hello-world' },
				{ input: 'Product_Slug V2', expected: 'product-slug-v2' },
				{ input: 'hello', expected: 'hello' },
				{ input: '123-abc', expected: '123-abc' },
				{ input: 'Hello@World!Test', expected: 'helloworldtest' },
				{
					input: 'spaces  and___underscores',
					expected: 'spaces-and-underscores',
				},
			];

			for (const { input, expected } of inputs) {
				const result = await autoValidator.run(input);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe(expected);
				}
			}
		});

		it('should handle edge cases', async () => {
			const edgeCases = [
				{ input: '___', expected: '' },
				{ input: '---', expected: '' },
				{ input: '_-_-_', expected: '' },
				{ input: 'a_b_c', expected: 'a-b-c' },
				{ input: 'a b c', expected: 'a-b-c' },
			];

			for (const { input, expected } of edgeCases) {
				const result = await autoValidator.run(input);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe(expected);
				}
			}
		});

		it('should remove special characters and convert', async () => {
			const inputs = [
				{ input: 'hello@world.com', expected: 'helloworldcom' },
				{ input: 'test#hashtag!', expected: 'testhashtag' },
				{ input: 'foo$bar%baz', expected: 'foobarbaz' },
			];

			for (const { input, expected } of inputs) {
				const result = await autoValidator.run(input);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe(expected);
				}
			}
		});

		it('should not convert when autoConvert is false', async () => {
			const standardValidator = new SlugValSan({
				autoConvert: false,
			});
			const result = await standardValidator.run('Hello World');
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].code).toBe('slug');
			}
		});
	});
});
