export type Role = 'HR_ADMIN' | 'RECRUITER' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string | null;
  experienceYears: number | null;
  appliedRole: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Resume {
  id: string;
  candidateId: string;
  fileUrl: string | null;
  extractedText: string | null;
  parsedSkills: {
    matched_skills?: string[];
    missing_skills?: string[];
    reason?: string;
  } | null;
  embeddingId: string | null;
  aiScore: number | null;
  createdAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  status: 'in_progress' | 'completed';
  transcript: TranscriptEntry[];
  scores: {
    perQuestion?: number[];
  };
  finalRating: number | null;
  aiFeedback: string | null;
  createdAt: string;
}

export type TranscriptEntry =
  | { type: 'question'; text: string; at: string }
  | { type: 'answer'; text: string; at: string }
  | { type: 'eval'; score: number; feedback: string; at: string };

export interface HRDocument {
  id: string;
  title: string;
  content: string;
  embeddingId: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface ChatLog {
  id: string;
  userId: string;
  question: string;
  answer: string;
  sourceDocId: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalCandidates: number;
  totalInterviews: number;
  totalResumes: number;
  averageInterviewScore: number;
  pendingInterviews: number;
}

export interface CreateCandidateData {
  name: string;
  email?: string;
  experienceYears?: number;
  appliedRole?: string;
}

export interface ProcessResumeData {
  jobRole?: string;
  requiredSkills: string[];
}
