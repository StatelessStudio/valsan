/* eslint-disable no-console */
import {
	ValSan,
	ValidationResult,
	ComposedValSan,
	TrimSanitizer,
	LowercaseSanitizer,
	StringToNumberValSan,
} from '../src';

class DoubleValSan extends ValSan<number, number> {
	override rules() {
		return {
			negative_number: {
				code: 'negative_number',
				user: {
					helperText: 'Non-negative number',
					errorMessage: 'Number must be non-negative',
				},
			},
		};
	}

	async validate(input: number): Promise<ValidationResult> {
		if (input < 0) {
			return this.fail([this.rules().negative_number]);
		}
		return this.pass();
	}

	async sanitize(input: number): Promise<number> {
		return input * 2;
	}
}

// Run examples
async function runExamples(): Promise<void> {
	console.log('=== Example 1: ComposedValSan - EmailValSan ===');
	class EmailFormatValSan extends ValSan<string, string> {
		override rules() {
			return {
				invalid_email: {
					code: 'invalid_email',
					user: {
						helperText: 'Email address',
						errorMessage: 'Input must be a valid email address',
					},
				},
			};
		}

		async validate(input: string): Promise<ValidationResult> {
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
				return this.fail([this.rules().invalid_email]);
			}
			return this.pass();
		}

		async sanitize(input: string): Promise<string> {
			return input;
		}
	}

	class EmailValSan extends ComposedValSan<string, string> {
		constructor() {
			super([
				new TrimSanitizer(),
				new LowercaseSanitizer(),
				new EmailFormatValSan(),
			]);
		}
	}

	const emailValidator = new EmailValSan();
	const result5 = await emailValidator.run('  User@Example.COM  ');
	console.log('Input: "  User@Example.COM  "');
	console.log('Output:', result5.data); // "user@example.com"
	console.log('Success:', result5.success);
	console.log();

	console.log('=== Example 2: ComposedValSan - Type Transform ===');
	class NumberPipeline extends ComposedValSan<string, number> {
		constructor() {
			super([
				new TrimSanitizer(),
				new StringToNumberValSan(),
				new DoubleValSan(),
			]);
		}
	}

	const numberValidator = new NumberPipeline();
	const result6 = await numberValidator.run('  15  ');
	console.log('Input: "  15  "');
	console.log('Output:', result6.data); // 30
	console.log('Type:', typeof result6.data); // "number"
	console.log('Success:', result6.success);
	console.log();

	console.log('=== Example 3: ComposedValSan Introspection ===');
	const steps = emailValidator.getSteps();
	console.log(`EmailValSan has ${steps.length} steps`);
	console.log(
		'Steps:',
		steps.map((s) => s.constructor.name)
	);
}

runExamples().catch(console.error);
