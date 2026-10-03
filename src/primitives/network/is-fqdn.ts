const fqdnPattern =
	/^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

export function isFqdn(input: string): boolean {
	return input.length <= 255 && fqdnPattern.test(input);
}
