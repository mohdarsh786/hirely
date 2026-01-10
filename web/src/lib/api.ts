import { supabase } from './supabase';
import { apiCache } from './cache';
import type { 
  Candidate, 
  Resume, 
  HRDocument, 
  ChatLog, 
  DashboardStats,
  BatchCandidate,
  BatchUpload,
  Job,
  CreateJobData,
  CreateCandidateData,
  ProcessResumeData,
  Interview,
  CreateInterviewData,
  TranscriptEntry
} from '@/types';

export type { 
  Candidate, 
  Resume, 
  HRDocument, 
  ChatLog, 
  DashboardStats,
  BatchCandidate,
  BatchUpload,
  Job,
  CreateJobData,
  CreateCandidateData,
  ProcessResumeData,
  Interview,
  CreateInterviewData,
  TranscriptEntry
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    return { Authorization: `Bearer ${data.session.access_token}` };
  }
  return {};
}

interface RequestOptions extends Omit<RequestInit, 'cache'> {
  useCache?: boolean;
  cacheTTL?: number;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { useCache: shouldCache = false, cacheTTL = 30000, ...fetchOptions } = options;
  const cacheKey = `${endpoint}:${JSON.stringify(fetchOptions.body || {})}`;

  // Check cache for GET requests
  if (shouldCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const url = `${API_URL}${endpoint}`;
  const authHeader = await getAuthHeader();

  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(error.message || error.error || 'Request failed', res.status, error);
  }

  const data = await res.json();

  // Cache successful GET requests
  if (shouldCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    apiCache.set(cacheKey, data, cacheTTL);
  }

  // Invalidate related cache on mutations
  if (fetchOptions.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method)) {
    const basePath = endpoint.split('/')[1];
    apiCache.invalidate(basePath);
  }

  return data;
}

export const api = {
  jobs: {
    list: () => request<{ jobs: Job[] }>('/jobs', { useCache: true }),
    get: (id: string) => request<{ job: Job }>(`/jobs/${id}`, { useCache: true }),
    create: (data: CreateJobData) =>
      request<{ job: Job }>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CreateJobData>) =>
      request<{ job: Job }>(`/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/jobs/${id}`, {
        method: 'DELETE',
      }),
    getSkillsByTitle: (title: string) =>
      request<{ skills: string[] }>(`/jobs/skills/by-title/${encodeURIComponent(title)}`, {
        useCache: true,
      }),
  },

  candidates: {
    list: () => request<{ candidates: Candidate[] }>('/candidates', { useCache: true }),
    get: (id: string) =>
      request<{ candidate: Candidate; job?: Job; resumes: Resume[]; interviews: Interview[] }>(
        `/candidates/${id}`,
        { useCache: true, cacheTTL: 60000 }
      ),
    search: (query: string) => 
        request<{ results: any[] }>('/candidates/search', {
            method: 'POST',
            body: JSON.stringify({ query })
        }),
    create: (data: CreateCandidateData) =>
      request<{ candidate: Candidate; job: Job }>('/candidates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/candidates/${id}`, {
        method: 'DELETE',
      }),
    getInsights: (id: string) =>
        request<{ 
            candidateId: string;
            candidateName: string;
            jobTitle: string;
            insights: {
                why_matched: string; // The "reason" from scoring
                suggested_interview_questions: string[];
                strengths: string[]; // matched skills
                weaknesses: string[]; // missing skills
            }
        }>(`/candidates/${id}/insights`, { useCache: true }),
  },

  resumes: {
    list: (candidateId?: string) => request<{ resumes: Resume[] }>(candidateId ? `/resumes/${candidateId}` : '/resumes', { useCache: true }),
    upload: async (candidateId: string, file: File) => {
      const authHeader = await getAuthHeader();
      const formData = new FormData();
      formData.append('candidateId', candidateId);
      formData.append('file', file);
      const res = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: authHeader,
        body: formData,
      });
      return res.json();
    },
    delete: (id: string) =>
      request<{ success: boolean }>(`/resumes/${id}`, {
        method: 'DELETE',
      }),
  },

  batch: {
    upload: async (jobId: string, files: File[]) => {
      const authHeader = await getAuthHeader();
      const formData = new FormData();
      formData.append('jobId', jobId);
      for (const file of files) {
        formData.append('files', file);
      }
      const res = await fetch(`${API_URL}/batch/upload`, {
        method: 'POST',
        headers: authHeader,
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new ApiError(error.message || error.error || 'Upload failed', res.status, error);
      }
      return res.json() as Promise<{ batchId: string; totalFiles: number }>;
    },
    createStatusStream: async (batchId: string) => {
      const authHeader = await getAuthHeader();
      const url = `${API_URL}/batch/${batchId}/status`;
      const eventSource = new EventSource(url, { withCredentials: true });
      return eventSource;
    },
    getStatusUrl: (batchId: string) => `${API_URL}/batch/${batchId}/status`,
    getResults: (batchId: string) =>
      request<{
        batchId: string;
        status: 'processing' | 'completed' | 'failed';
        totalFiles: number;
        processedCount: number;
        candidates: BatchCandidate[];
      }>(`/batch/${batchId}/results`),
    quickCreateJob: (data: { title: string; requiredSkills: string[]; description?: string }) =>
      request<{ job: Job }>('/batch/quick-job', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getHistory: () =>
      request<{ batches: BatchUpload[] }>('/batch/history'),
  },

  integrations: {
    getGmailAuthUrl: (jobId: string) =>
      request<{ url: string }>('/integrations/gmail/auth-url', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),
    getDriveAuthUrl: (jobId: string) =>
      request<{ url: string }>('/integrations/drive/auth-url', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),
    // Unified callback
    callback: (code: string, state?: string) =>
      request<{ success: boolean; email: string; jobId?: string }>('/integrations/callback', {
        method: 'POST',
        body: JSON.stringify({ code, state }),
      }),
    syncGmail: (jobId: string, searchQuery?: string) =>
      request<{ batchId: string; count: number; message?: string }>('/integrations/gmail/' + jobId + '/sync', {
        method: 'POST',
        body: JSON.stringify({ searchQuery }),
      }),
    syncDrive: (jobId: string, folderId?: string) =>
      request<{ batchId: string; count: number; message?: string }>('/integrations/drive/' + jobId + '/sync', {
        method: 'POST',
        body: JSON.stringify({ folderId }),
      }),
    getDriveFolders: () =>
      request<{ folders: { id: string; name: string }[] }>('/integrations/drive/folders'),
    getStatus: () =>
      request<{
        gmail: { id: string; email: string; metadata: any; updatedAt: string } | null;
        drive: { id: string; email: string; metadata: any; updatedAt: string } | null;
      }>('/integrations/status'),
    disconnect: (provider: 'gmail' | 'drive') =>
      request<{ success: boolean; message: string }>(`/integrations/${provider}`, {
        method: 'DELETE',
      }),
  },

  interviews: {
    list: () => request<{ interviews: Interview[] }>('/interview', { useCache: true }),
    create: (data: CreateInterviewData) =>
      request<{ interview: Interview }>('/interview/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    start: (candidateId: string, role?: string) =>
      request<{ interviewId: string; question: string }>(
        `/interview/start/${candidateId}`,
        {
          method: 'POST',
          body: JSON.stringify({ role }),
        }
      ),
    answer: (interviewId: string, answer: string) =>
      request<{ 
        nextQuestion: string | null; 
        question: string | null;
        feedback: string; 
        score: number;
        evaluation?: { score: number; feedback: string };
        interview?: Interview;
        isComplete?: boolean;
      }>(
        `/interview/answer/${interviewId}`,
        {
          method: 'POST',
          body: JSON.stringify({ answer }),
        }
      ),
    finalize: (interviewId: string) =>
      request<{ interview: Interview }>(`/interview/finalize/${interviewId}`, {
        method: 'POST',
      }),
    get: (interviewId: string) =>
      request<{ interview: Interview }>(`/interview/${interviewId}`, { useCache: true, cacheTTL: 60000 }),
    delete: (interviewId: string) =>
      request<{ success: boolean }>(`/interview/${interviewId}`, {
        method: 'DELETE',
      }),
    sendInvite: (interviewId: string) =>
      request<{ success: boolean; message: string }>(`/interview/${interviewId}/send-invite`, {
        method: 'POST',
      }),
    makeDecision: (interviewId: string, decision: 'shortlisted' | 'rejected', note?: string) =>
      request<{ success: boolean; message: string; interview: Interview }>(`/interview/${interviewId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      }),
  },

  hrChat: {
    query: (question: string, topK?: number) =>
      request<{ answer: string; sources: { id: string; title: string }[] }>(
        '/hr-chat/query',
        {
          method: 'POST',
          body: JSON.stringify({ question, topK }),
        }
      ),
  },

  hrDocs: {
    list: () => request<{ documents: HRDocument[] }>('/hr-docs'),
    get: (id: string) => request<{ document: HRDocument }>(`/hr-docs/${id}`),
    upload: async (file: File, title: string) => {
      const authHeader = await getAuthHeader();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      const res = await fetch(`${API_URL}/hr-docs/upload`, {
        method: 'POST',
        headers: authHeader,
        body: formData,
      });
      return res.json();
    },
  },

  stats: {
    dashboard: () =>
      request<{
        stats: {
          totalCandidates: number;
          totalInterviews: number;
          totalResumes: number;
          averageInterviewScore: number;
          pendingInterviews: number;
        };
        recentCandidates: Candidate[];
      }>('/stats/dashboard'),
  },

  organizations: {
    register: (data: { name: string; domain?: string; userId: string }) =>
      request<{ organization: Organization }>('/organizations/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) =>
      request<{ organization: Organization; members: OrganizationMember[] }>(
        `/organizations/${id}`
      ),
    update: (id: string, data: { name?: string; domain?: string }) =>
      request<{ organization: Organization }>(`/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    inviteMember: (orgId: string, data: { email: string; role: string }) =>
      request<{ success: boolean; user: unknown }>(`/organizations/${orgId}/invite-member`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMembers: (orgId: string) =>
      request<{ members: OrganizationMember[] }>(`/organizations/${orgId}/members`),
    getMyOrg: () =>
      request<{ organization: Organization; role: string; members: OrganizationMember[] }>('/organizations/mine'),
  },

  invites: {
    createCandidate: (data: { candidateId: string; interviewId?: string; email: string; expiresInDays?: number }) =>
      request<{ invite: CandidateInvite; inviteLink: string }>('/invites/candidate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    validate: (token: string) =>
      request<{
        valid: boolean;
        invite: CandidateInvite;
        candidate: Candidate;
        interview: Interview | null;
      }>(`/invites/validate/${token}`),
    accept: (token: string) =>
      request<{ success: boolean; invite: CandidateInvite }>(`/invites/accept/${token}`, {
        method: 'POST',
      }),
    getForCandidate: (candidateId: string) =>
      request<{ invites: CandidateInvite[] }>(`/invites/candidate/${candidateId}`),
  },

  public: {
    getInterview: (token: string) =>
      request<{ candidate: Candidate; interview: Interview | null; token: string }>(
        `/public/interview/${token}`
      ),
    submitAnswer: (token: string, data: { answer: string; questionIndex: number }) =>
      request<{ success: boolean; questionIndex: number }>(`/public/interview/${token}/answer`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getResult: (token: string) =>
      request<{
        finalRating: number;
        aiFeedback: string;
        completedAt: string;
      }>(`/public/interview/${token}/result`),
  },
};

export interface Organization {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'HR_ADMIN' | 'RECRUITER' | 'EMPLOYEE';
  createdAt: string;
}

export interface CandidateInvite {
  id: string;
  candidateId: string;
  interviewId: string | null;
  token: string;
  email: string;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
}
