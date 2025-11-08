import 'jasmine';
import * as index from '../../src';

describe('valsan', () => {
	it('exports a', () => {
		expect(index.a).toBeTrue();
	});
});
