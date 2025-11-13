import 'jasmine';
import { ValSan } from '../../../src';
import { TestValSan, TypeTransformValSan } from './test-implementations';

describe('ValSan - Basic Operations', () => {
	it('should export the ValSan class', () => {
		expect(ValSan).toBeDefined();
	});

	it('should export default rules', () => {
		const valsan = new (class extends ValSan<string, string> {
			override async validate() {
				return this.pass();
			}

			override async sanitize(input: string) {
				return input;
			}
		})();

		const rules = valsan.rules();
		expect(rules).toBeDefined();
	});

	describe('run() - successful validation and sanitization', () => {
		it('should return success with sanitized data', async () => {
			const valsan = new TestValSan();
			const result = await valsan.run('hello');

			expect(result.success).toBe(true);
			expect(result.data).toBe('HELLO');
			expect(result.errors).toEqual([]);
		});

		it('should work with type transformation', async () => {
			const valsan = new TypeTransformValSan();
			const result = await valsan.run('42');

			expect(result.success).toBe(true);
			expect(result.data).toBe(42);
			expect(result.errors).toEqual([]);
		});
	});
});
