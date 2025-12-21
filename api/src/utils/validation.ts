import { z } from 'zod';

const uuidSchema = z.string().uuid();

export function isValidUuid(value: string): boolean {
	return uuidSchema.safeParse(value).success;
}

const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const MAX_HR_DOC_SIZE = 20 * 1024 * 1024;

export function validateResumeFile(file: File) {
	// Check file extension
	if (!file.name.toLowerCase().endsWith('.pdf')) {
		throw new Error('Only PDF files are allowed');
	}
	
	// Check MIME type
	if (file.type !== 'application/pdf') {
		throw new Error('Invalid file type');
	}
	
	// Check file size
	if (file.size > MAX_RESUME_SIZE) {
		throw new Error('File size must not exceed 10MB');
	}
	
	// Check for empty filename
	const nameWithoutExt = file.name.slice(0, -4);
	if (!nameWithoutExt || nameWithoutExt.trim() === '') {
		throw new Error('Invalid filename');
	}
}

export function validateHRDocumentFile(file: File) {
	// More lenient validation for HR documents
	const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
	
	if (file.size > MAX_HR_DOC_SIZE) {
		throw new Error('File too large. Maximum size is 20MB');
	}
	
	const isValid = allowedTypes.some(t => file.type.toLowerCase().includes(t.toLowerCase())) ||
	                file.name.toLowerCase().endsWith('.pdf') ||
	                file.name.toLowerCase().endsWith('.txt');
	
	if (!isValid) {
		throw new Error('Invalid file type. Upload PDF or text documents');
	}
}
