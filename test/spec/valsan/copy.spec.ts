import 'jasmine';
import { ComposedValSan } from '../../../src';
import { TestValSan, TypeTransformValSan } from './test-implementations';

describe('ValSan - Copy', () => {
	it('should create a copy with modified options', () => {
		const original = new TestValSan({ isOptional: false });
		const copy = original.copy({ isOptional: true });

		expect(copy.options.isOptional).toBe(true);
		expect(original.options.isOptional).toBe(false);
	});

	it('copied instance should function independently', async () => {
		const original = new TestValSan({ isOptional: false });
		const copy = original.copy({ isOptional: true });

		const originalResult = await original.run(
			undefined as unknown as string
		);
		expect(originalResult.success).toBe(false);

		const copyResult = await copy.run(undefined as unknown as string);
		expect(copyResult.success).toBe(true);
		expect(copyResult.data).toBeUndefined();
	});
});

describe('ComposedValSan - Copy', () => {
	it('should create a copy with modified options', () => {
		const step1 = new TestValSan();
		const step2 = new TypeTransformValSan();

		const original = new ComposedValSan([step1, step2], {
			isOptional: false,
		});
		const copy = original.copy({ isOptional: true });
		expect(copy.options.isOptional).toBe(true);
		expect(original.options.isOptional).toBe(false);
	});

	it('copied instance should function independently', async () => {
		const step1 = new TestValSan();
		const step2 = new TypeTransformValSan();

		const original = new ComposedValSan([step1, step2], {
			isOptional: false,
		});

		const copy = original.copy({ isOptional: true });
		const originalResult = await original.run(
			undefined as unknown as string
		);

		expect(originalResult.success).toBe(false);
		const copyResult = await copy.run(undefined as unknown as string);
		expect(copyResult.success).toBe(true);
		expect(copyResult.data).toBeUndefined();
	});
});
