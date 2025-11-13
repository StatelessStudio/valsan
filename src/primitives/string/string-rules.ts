import { Rule } from '../../rules/rule';

export const stringRule: Rule = {
	code: 'string',
	user: {
		helperText: 'Text',
		errorMessage: 'Value is not valid text',
	},
	dev: {
		helperText: 'string',
		errorMessage: 'Value is not of type string',
	},
};

export const stringNotEmptyRule: Rule = {
	code: 'string_not_empty',
	user: {
		helperText: 'Not empty',
		errorMessage: 'Value must not be empty',
	},
	dev: {
		helperText: 'not empty string',
		errorMessage: 'Value must not be empty',
	},
};
