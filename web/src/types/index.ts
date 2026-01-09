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
  jobId?: string | null;
  appliedRole: string | null;
  organizationId?: string | null;
  createdBy: string | null;
  createdAt: string;
  job?: Job;
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
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt?: string;
  durationMinutes?: number;
  token?: string;
  questions?: any[];
  answers?: any[];
  startedAt?: string;
  completedAt?: string;
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

export interface Job {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  requiredSkills: string[];
  experienceYears: number | null;
  status: 'active' | 'closed' | 'draft';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobData {
  title: string;
  description?: string;
  requiredSkills: string[];
  experienceYears?: number;
}

export interface CreateCandidateData {
  name: string;
  email?: string;
  experienceYears?: number;
  appliedRole?: string;
  jobId?: string;
}

export interface ProcessResumeData {
  candidateId: string;
  fileUrl: string;
  extractedText?: string;
}

export interface CreateInterviewData {
  candidateId: string;
  scheduledAt?: string;
  durationMinutes?: number;
}

export interface DashboardStats {
  totalCandidates: number;
  totalResumes: number;
  totalInterviews: number;
  avgAIScore: number;
}

export interface BatchCandidate {
  id: string;
  name: string;
  email: string | null;
  score: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  // Search result fields
  similarity?: number;
}

export interface BatchUpload {
  id: string;
  jobId: string;
  organizationId: string;
  createdBy: string;
  totalFiles: number;
  processedCount: number;
  status: 'processing' | 'completed' | 'failed';
  candidateIds: string[];
  createdAt: string;
  completedAt: string | null;
  job?: Job;
}

