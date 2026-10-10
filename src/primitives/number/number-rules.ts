import { Rule } from '../../rules';

export const numberRule: Rule = {
	code: 'number',
	kind: 'type.number',
	user: {
		helperText: 'Number',
		errorMessage: 'Value is not a valid number',
	},
};
