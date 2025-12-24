'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { api, type Resume } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import dynamic from 'next/dynamic';

const ResumeProcessingDoodle = dynamic(
  () => import('@/components/doodles/ResumeProcessingDoodle').then(mod => mod.ResumeProcessingDoodle),
  { ssr: false, loading: () => <div className="h-56 w-56" /> }
);

function ResumesPageContent() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const data = await api.resumes.list();
      setResumes(data.resumes || []);
    } catch (error) {
      console.error('Failed to load resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResumes = resumes
    .filter((r) => {
      if (!minScore) return true;
      const scoreThreshold = parseInt(minScore);
      return r.aiScore !== null && r.aiScore >= scoreThreshold;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return (b.aiScore || 0) - (a.aiScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Resumes</h1>
        <Link href="/candidates">
          <Button>View Candidates</Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="minScore">Minimum Score</Label>
          <Input
            id="minScore"
            type="number"
            min="0"
            max="100"
            placeholder="Min Score"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            onClick={() => setSortBy('date')}
          >
            Sort by Date
          </Button>
        </div>
        <div className="flex items-end">
          <Button
            variant={sortBy === 'score' ? 'default' : 'outline'}
            onClick={() => setSortBy('score')}
          >
            Sort by Score
          </Button>
        </div>
      </div>

      {filteredResumes.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center text-center">
            <ResumeProcessingDoodle className="h-56 w-56 opacity-80" />
            <p className="mt-4 mb-4 text-sm text-slate-600">
              {resumes.length === 0 ? 'No resumes found' : 'No resumes match the filter'}
            </p>
            <Link href="/candidates">
              <Button>View Candidates</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResumes.map((resume) => (
                <TableRow key={resume.id}>
                  <TableCell>
                    <Link
                      href={`/candidates/${resume.candidateId}`}
                      className="font-medium hover:underline"
                    >
                      Candidate #{resume.candidateId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {resume.aiScore !== null ? (
                      <Badge
                        variant={resume.aiScore >= 70 ? 'default' : 'secondary'}
                        data-testid="resume-score"
                      >
                        {resume.aiScore}
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell data-testid="resume-date">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {resume.fileUrl && (
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function ResumesPage() {
  return (
    <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER']}>
      <ResumesPageContent />
    </RouteGuard>
  );
}
