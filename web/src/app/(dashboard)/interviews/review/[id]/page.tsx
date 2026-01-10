'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import { InterviewReview } from './_components/InterviewReview';
import { PageLoader } from '@/components/ui/loading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InterviewReviewPage({ params }: PageProps) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [interviewRes, candidateRes] = await Promise.all([
          api.interviews.get(id),
          api.interviews.get(id).then(res => api.candidates.get(res.interview.candidateId))
        ]);

        // Fetch candidate's resume
        let resume = null;
        try {
          const resumesData = await api.resumes.list(interviewRes.interview.candidateId);
          resume = resumesData.resumes?.[0] || null;
        } catch (err) {
          console.error('Failed to fetch resume:', err);
        }

        setData({
          interview: interviewRes.interview,
          candidate: candidateRes.candidate,
          resume
        });
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err?.message || 'Failed to load interview data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) return <PageLoader />;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-center">No data found</div>;

  return (
    <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER']}>
      <InterviewReview 
        interview={data.interview} 
        candidate={data.candidate}
        resume={data.resume}
      />
    </RouteGuard>
  );
}
