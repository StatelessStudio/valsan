import { HexColorValSan } from '../../../../src/primitives';

describe('HexColorValSan', () => {
	// 6-digit hex colors
	const red = '#FF0000';
	const green = '#00FF00';
	const blue = '#0000FF';
	const white = '#FFFFFF';
	const black = '#000000';
	const gray = '#808080';
	const lowercase = '#ff0000';

	// 3-digit hex colors
	const redShort = '#F00';
	const greenShort = '#0F0';
	const blueShort = '#00F';
	const whiteShort = '#FFF';
	const blackShort = '#000';

	// 8-digit hex colors (with alpha)
	const redAlpha = '#FF0000FF';
	const redTransparent = '#FF000080';
	const redTransparentLow = '#FF000000';

	// 4-digit hex colors (with alpha)
	const redAlphaShort = '#F00F';
	const redTransparentShort = '#F008';

	it('accepts 6-digit hex color red', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(red);
		expect(result.success).toBe(true);
		expect(result.data).toBe(red.toUpperCase());
	});

	it('accepts 6-digit hex color green', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(green);
		expect(result.success).toBe(true);
		expect(result.data).toBe(green.toUpperCase());
	});

	it('accepts 6-digit hex color blue', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(blue);
		expect(result.success).toBe(true);
		expect(result.data).toBe(blue.toUpperCase());
	});

	it('accepts white color', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(white);
		expect(result.success).toBe(true);
		expect(result.data).toBe(white.toUpperCase());
	});

	it('accepts black color', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(black);
		expect(result.success).toBe(true);
		expect(result.data).toBe(black.toUpperCase());
	});

	it('accepts gray color', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(gray);
		expect(result.success).toBe(true);
		expect(result.data).toBe(gray.toUpperCase());
	});

	it('converts lowercase to uppercase', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(lowercase);
		expect(result.success).toBe(true);
		expect(result.data).toBe(red.toUpperCase());
	});

	it('accepts 3-digit short hex color red', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(redShort);
		expect(result.success).toBe(true);
		expect(result.data).toBe(redShort.toUpperCase());
	});

	it('accepts 3-digit short hex color green', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(greenShort);
		expect(result.success).toBe(true);
		expect(result.data).toBe(greenShort.toUpperCase());
	});

	it('accepts 3-digit short hex color blue', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(blueShort);
		expect(result.success).toBe(true);
		expect(result.data).toBe(blueShort.toUpperCase());
	});

	it('accepts 3-digit white', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(whiteShort);
		expect(result.success).toBe(true);
		expect(result.data).toBe(whiteShort.toUpperCase());
	});

	it('accepts 3-digit black', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(blackShort);
		expect(result.success).toBe(true);
		expect(result.data).toBe(blackShort.toUpperCase());
	});

	it('accepts 8-digit hex color with full alpha', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(redAlpha);
		expect(result.success).toBe(true);
		expect(result.data).toBe(redAlpha.toUpperCase());
	});

	it('accepts 8-digit hex color with 50% alpha', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(redTransparent);
		expect(result.success).toBe(true);
		expect(result.data).toBe(redTransparent.toUpperCase());
	});

	it('accepts 8-digit hex color with zero alpha', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(redTransparentLow);
		expect(result.success).toBe(true);
		expect(result.data).toBe(redTransparentLow.toUpperCase());
	});

	it('accepts 4-digit short hex with full alpha', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(redAlphaShort);
		expect(result.success).toBe(true);
		expect(result.data).toBe(redAlphaShort.toUpperCase());
	});

	it('accepts 4-digit short hex with partial alpha', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run(redTransparentShort);
		expect(result.success).toBe(true);
		expect(result.data).toBe(redTransparentShort.toUpperCase());
	});

	it('trims whitespace', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('  #FF0000  ');
		expect(result.success).toBe(true);
		expect(result.data).toBe(red.toUpperCase());
	});

	it('accepts mixed case', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#FfAaEe');
		expect(result.success).toBe(true);
		expect(result.data).toBe('#FFAAEE');
	});

	it('rejects missing hash', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('FF0000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects invalid characters', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#GG0000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects 2-digit hex', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#FF');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects 5-digit hex', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#FF000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects 7-digit hex', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#FF00000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects 9-digit hex', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#FF0000000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects empty string', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects only hash', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects spaces in hex', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#FF 00 00');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects special characters', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#FF@000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('rejects non-string input', async () => {
		const validator = new HexColorValSan();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(null as any);
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('required');
	});

	it('rejects number input', async () => {
		const validator = new HexColorValSan();
		const num: unknown = 255;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(num as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('rejects object input', async () => {
		const validator = new HexColorValSan();
		const obj: unknown = { color: '#FF0000' };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(obj as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('rejects array input', async () => {
		const validator = new HexColorValSan();
		const arr: unknown = ['#FF0000'];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await validator.run(arr as any); // eslint-disable-line
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('string');
	});

	it('accepts all valid hex digits', async () => {
		const validator = new HexColorValSan();
		// Create a valid 6-digit hex with all different digits
		const result = await validator.run('#FEDCBA');
		expect(result.success).toBe(true);
		expect(result.data).toBe('#FEDCBA');
	});

	it('rejects duplicate hashes', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('##FF0000');
		expect(result.success).toBe(false);
		expect(result.errors[0].code).toBe('hex_color');
	});

	it('handles uppercase hex digits', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#ABCDEF');
		expect(result.success).toBe(true);
		expect(result.data).toBe('#ABCDEF');
	});

	it('handles lowercase hex digits', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#abcdef');
		expect(result.success).toBe(true);
		expect(result.data).toBe('#ABCDEF');
	});

	it('handles mixed case hex digits', async () => {
		const validator = new HexColorValSan();
		const result = await validator.run('#AaBbCcDd');
		expect(result.success).toBe(true);
		expect(result.data).toBe('#AABBCCDD');
	});
});
