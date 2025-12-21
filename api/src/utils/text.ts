import { PDFParse } from 'pdf-parse';

export async function extractTextFromUpload(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const isPdf = file.type.toLowerCase().includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
	
	if (isPdf) {
		try {
			const parser = new PDFParse({ data: new Uint8Array(buffer) });
			const result = await parser.getText();
			return (result.text || '').trim();
		} catch (error) {
			console.error('[TEXT] PDF parsing failed:', error);
			throw new Error('Failed to extract text from PDF');
		}
	}

	return new TextDecoder('utf-8').decode(buffer).trim();
}
