import 'jasmine';
import { ValSan, ValidationResult, ComposedValSan } from '../../../src';
import { TestValSan } from './test-implementations';

describe('ValSan - isOptional Option', () => {
	class SimpleStringValSan extends ValSan<string, string> {
		async validate(input: string): Promise<ValidationResult> {
			if (!input || input.length === 0) {
				return {
					isValid: false,
					errors: [
						{
							code: 'REQUIRED',
							message: 'Input is required',
						},
					],
				};
			}
			return { isValid: true, errors: [] };
		}

		async sanitize(input: string): Promise<string> {
			return input.toUpperCase();
		}
	}

	describe('ValSan with isOptional', () => {
		it('should allow undefined when isOptional is true', async () => {
			const valsan = new SimpleStringValSan({ isOptional: true });
			const result = await valsan.run(undefined as unknown as string);

			expect(result.success).toBe(true);
			expect(result.data).toBeUndefined();
			expect(result.errors).toEqual([]);
		});

		it('should allow null when isOptional is true', async () => {
			const valsan = new SimpleStringValSan({ isOptional: true });
			const result = await valsan.run(null as unknown as string);

			expect(result.success).toBe(true);
			expect(result.data).toBeNull();
			expect(result.errors).toEqual([]);
		});

		it('should process valid values when isOptional is true', async () => {
			const valsan = new SimpleStringValSan({ isOptional: true });
			const result = await valsan.run('hello');

			expect(result.success).toBe(true);
			expect(result.data).toBe('HELLO');
			expect(result.errors).toEqual([]);
		});

		it('should reject undefined when isOptional is false', async () => {
			const valsan = new SimpleStringValSan({ isOptional: false });
			const result = await valsan.run(undefined as unknown as string);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should reject null when isOptional is false', async () => {
			const valsan = new SimpleStringValSan({ isOptional: false });
			const result = await valsan.run(null as unknown as string);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should default to false when not specified', async () => {
			const valsan = new SimpleStringValSan();
			const result = await valsan.run(undefined as unknown as string);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should not skip validation for empty strings', async () => {
			const valsan = new SimpleStringValSan({ isOptional: true });
			const result = await valsan.run('');

			expect(result.success).toBe(false);
			expect(result.errors[0].code).toBe('REQUIRED');
		});
	});

	describe('ComposedValSan with isOptional', () => {
		it('should allow undefined when isOptional is true', async () => {
			const composed = new ComposedValSan([new TestValSan()], {
				isOptional: true,
			});
			const result = await composed.run(undefined as unknown as string);

			expect(result.success).toBe(true);
			expect(result.data).toBeUndefined();
			expect(result.errors).toEqual([]);
		});

		it('should allow null when isOptional is true', async () => {
			const composed = new ComposedValSan([new TestValSan()], {
				isOptional: true,
			});
			const result = await composed.run(null as unknown as string);

			expect(result.success).toBe(true);
			expect(result.data).toBeNull();
			expect(result.errors).toEqual([]);
		});

		it('should process valid values when isOptional is true', async () => {
			const composed = new ComposedValSan([new TestValSan()], {
				isOptional: true,
			});
			const result = await composed.run('hello');

			expect(result.success).toBe(true);
			expect(result.data).toBe('HELLO');
			expect(result.errors).toEqual([]);
		});

		it('should reject undefined when isOptional is false', async () => {
			const composed = new ComposedValSan([new SimpleStringValSan()], {
				isOptional: false,
			});
			const result = await composed.run(undefined as unknown as string);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should default to false when not specified', async () => {
			const composed = new ComposedValSan([new SimpleStringValSan()]);
			const result = await composed.run(undefined as unknown as string);

			expect(result.success).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should work with multiple steps in composition', async () => {
			const composed = new ComposedValSan(
				[new TestValSan(), new TestValSan()],
				{ isOptional: true }
			);
			const result = await composed.run(undefined as unknown as string);

			expect(result.success).toBe(true);
			expect(result.data).toBeUndefined();
		});

		it('should bypass all steps when optional and undefined', async () => {
			let step1Called = false;
			let step2Called = false;

			class TrackedValSan extends ValSan<string, string> {
				constructor(private tracker: () => void) {
					super();
				}

				async validate(): Promise<ValidationResult> {
					this.tracker();
					return { isValid: true, errors: [] };
				}

				async sanitize(input: string): Promise<string> {
					return input;
				}
			}

			const composed = new ComposedValSan(
				[
					new TrackedValSan(() => {
						step1Called = true;
					}),
					new TrackedValSan(() => {
						step2Called = true;
					}),
				],
				{ isOptional: true }
			);

			await composed.run(undefined as unknown as string);

			expect(step1Called).toBe(false);
			expect(step2Called).toBe(false);
		});
	});
});
