import { Rule } from './rule';

export const requiredRule: Rule = {
	code: 'required',
	user: {
		helperText: 'Required',
		errorMessage: 'Value is empty',
	},
};
