export interface RuleHint {
	helperText: string;
	errorMessage: string;
}

export interface Rule {
	code: string;
	user: RuleHint;
	dev?: RuleHint;
	context?: Record<string, unknown>;
}

export type RuleSet = Record<string, Rule>;
