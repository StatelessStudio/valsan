export interface RuleHint {
	helperText: string;
	errorMessage: string;
}

interface RuleJsonSchemaConstraints {
	minimum?: number;
	maximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	format?: 'email';
	enum?: readonly (string | number | boolean)[];
}

export type RuleJsonSchema = {
	[Key in keyof RuleJsonSchemaConstraints]-?:
		Required<Pick<RuleJsonSchemaConstraints, Key>> &
		RuleJsonSchemaConstraints;
}[keyof RuleJsonSchemaConstraints];

export type RuleConstraint =
	| {
		kind: 'type.number' | 'type.string' | 'type.integer' | 'type.boolean';
		context?: Record<string, unknown>;
	}
	| { kind: 'number.minimum'; context: { min: number } }
	| { kind: 'number.maximum'; context: { max: number } }
	| { kind: 'number.range'; context: { min: number; max: number } }
	| { kind: 'string.minLength'; context: { minLength: number } }
	| { kind: 'string.maxLength'; context: { maxLength: number } }
	| {
		kind: 'string.pattern';
		context: { pattern: string; regex: RegExp };
	}
	| { kind: 'value.enum'; context: { allowedValues: readonly unknown[] } }
	| {
		kind: 'string.email';
		context: { allowPlusAddress: boolean };
	}
	| {
		kind: 'string.emailDomains';
		context: { allowedDomains: readonly string[] | undefined };
	};

interface RuleDetails {
	code: string;
	user: RuleHint;
	dev?: RuleHint;
	/**
	 * Declarative constraints on the normalized value. 'type-only' explicitly
	 * exports wire types without encoding this rule's runtime behavior.
	 * Explicit metadata takes precedence over kind-based derivation.
	 */
	jsonSchema?: RuleJsonSchema | 'type-only';
}

export type Rule = RuleDetails & (
	| RuleConstraint
	| { kind?: undefined; context?: Record<string, unknown> }
);

export type RuleSet = Record<string, Rule>;
