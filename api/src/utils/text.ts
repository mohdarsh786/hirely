import { join } from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Set worker to the local file path to avoid "No GlobalWorkerOptions.workerSrc" error
pdfjsLib.GlobalWorkerOptions.workerSrc = join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
	try {
		const data = new Uint8Array(buffer);
		const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
		
		const textParts: string[] = [];
		
		for (let i = 1; i <= doc.numPages; i++) {
			const page = await doc.getPage(i);
			const content = await page.getTextContent();
			const pageText = content.items
				.map((item: any) => item.str || '')
				.join(' ');
			textParts.push(pageText);
		}
		
		return textParts.join('\n').trim();
	} catch (error) {
		console.error('[PDF] Extraction failed:', error);
		throw new Error('Failed to extract text from PDF');
	}
}

export async function extractTextFromUpload(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const isPdf = file.type.toLowerCase().includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
	
	if (isPdf) {
		return extractTextFromPdf(buffer);
	}

	return new TextDecoder('utf-8').decode(buffer).trim();
}
