export function parseJsonObject(text: string): unknown {
	const start = text.indexOf('{');
	const end = text.lastIndexOf('}');
	
	if (start === -1 || end === -1 || end <= start) {
		throw new Error('No JSON object found in text');
	}
	
	const json = text.slice(start, end + 1);
	
	try {
		return JSON.parse(json);
	} catch (error) {
		throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
	}
}
