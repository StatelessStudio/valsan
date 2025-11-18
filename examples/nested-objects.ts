/**
 * Example: Using ObjectValSan for nested object validation
 *
 * This example demonstrates how to use the new ObjectValSan primitive
 * to create nested ObjectSanitizers.
 */

import {
	ObjectValSan,
	TrimSanitizer,
	EmailValidator,
	IntegerValidator,
} from '../src';

// Define a nested address schema
const addressValSan = new ObjectValSan({
	schema: {
		street: new TrimSanitizer(),
		city: new TrimSanitizer(),
		zipCode: new TrimSanitizer(),
	},
});

// Define a user schema with nested address
const userSchema = new ObjectValSan({
	schema: {
		name: new TrimSanitizer(),
		email: new EmailValidator(),
		age: new IntegerValidator(),
		address: addressValSan, // Nested object
	},
});

// Example usage
async function example() {
	const result = await userSchema.run({
		name: '  John Doe  ',
		email: 'john@example.com',
		age: 30,
		address: {
			street: '  123 Main St  ',
			city: '  Springfield  ',
			zipCode: '  12345  ',
		},
	});

	if (result.success) {
		// eslint-disable-next-line no-console
		console.log('Validated and sanitized user:', result.data);
		// Output:
		// {
		//   name: 'John Doe',
		//   email: 'john@example.com',
		//   age: 30,
		//   address: {
		//     street: '123 Main St',
		//     city: 'Springfield',
		//     zipCode: '12345'
		//   }
		// }
	}
	else {
		// eslint-disable-next-line no-console
		console.error('Validation errors:', result.errors);
	}
}

// Deeply nested example
const cityValSan = new ObjectValSan({
	schema: {
		name: new TrimSanitizer(),
		population: new IntegerValidator({ isOptional: true }),
	},
});

const deepAddressValSan = new ObjectValSan({
	schema: {
		street: new TrimSanitizer(),
		city: cityValSan, // Nested ObjectValSan
	},
});

const deepUserSchema = new ObjectValSan({
	schema: {
		name: new TrimSanitizer(),
		address: deepAddressValSan, // Deeply nested
	},
});

async function deepExample() {
	const result = await deepUserSchema.run({
		name: '  Jane Doe  ',
		address: {
			street: '  456 Oak Ave  ',
			city: {
				name: '  Metropolis  ',
				population: 1000000,
			},
		},
	});

	if (result.success) {
		// eslint-disable-next-line no-console
		console.log('Deeply nested validated user:', result.data);
		// Output:
		// {
		//   name: 'Jane Doe',
		//   address: {
		//     street: '456 Oak Ave',
		//     city: {
		//       name: 'Metropolis',
		//       population: 1000000
		//     }
		//   }
		// }
	}
}

void example();
void deepExample();
