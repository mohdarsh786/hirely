'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RankedDashboard } from '@/components/batch/RankedDashboard';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { BatchCandidate } from '@/types';
import Link from 'next/link';

interface BatchResult {
  batchId: string;
  status: string;
  totalFiles: number;
  processedCount: number;
  candidates: BatchCandidate[];
}

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.batch.getResults(params.id as string);
        setResult(data);
      } catch (err) {
        setError('Failed to load batch results');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">{error || 'Batch not found'}</p>
          <Link href="/batch-upload" className="mt-4 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to uploads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/batch-upload" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Batch Results</h1>
          <p className="text-sm text-gray-500">{result.totalFiles} resumes processed</p>
        </div>
      </div>

      <RankedDashboard candidates={result.candidates} jobTitle="Batch Analysis" />
    </div>
  );
}
