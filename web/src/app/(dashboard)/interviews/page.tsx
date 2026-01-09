'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { InterviewsTable } from './_components/InterviewsTable';
import type { Interview } from '@/types';

export default function InterviewsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!['HR_ADMIN', 'RECRUITER'].includes(user.role)) {
      router.push('/403');
      return;
    }

    fetchInterviews();
  }, [user, authLoading, router]);

  const fetchInterviews = async () => {
    try {
      const data = await api.interviews.list();
      setInterviews(data.interviews || []);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Interviews</h1>
        <div className="flex gap-3">
          <Link href="/interviews/new">
            <Button className="bg-slate-900 hover:bg-slate-800">Schedule Interview</Button>
          </Link>
        </div>
      </div>
      <InterviewsTable initialData={interviews} />
    </div>
  );
}