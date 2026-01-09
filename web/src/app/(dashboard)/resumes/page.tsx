'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// 1. FAST ICON IMPORT (Direct Path)
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

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
import { api, type Resume } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';

// 2. OPTIMIZED DYNAMIC IMPORT
// Moved the doodle to a sub-component to keep the main page AST small
const EmptyState = dynamic(() => import('./_components/ResumeEmptyState'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-slate-50 rounded-lg" />
});

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
      if (sortBy === 'score') return (b.aiScore || 0) - (a.aiScore || 0);
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
        <Link href="/candidates"><Button>View Candidates</Button></Link>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="minScore">Minimum Score</Label>
          <Input id="minScore" type="number" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button variant={sortBy === 'date' ? 'default' : 'outline'} onClick={() => setSortBy('date')}>Sort by Date</Button>
          <Button variant={sortBy === 'score' ? 'default' : 'outline'} onClick={() => setSortBy('score')}>Sort by Score</Button>
        </div>
      </div>

      {filteredResumes.length === 0 ? (
        <EmptyState hasResumes={resumes.length > 0} />
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
                    <Link href={`/candidates/${resume.candidateId}`} className="font-medium hover:underline">
                      Candidate #{resume.candidateId.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {resume.aiScore !== null ? (
                      <Badge variant={resume.aiScore >= 70 ? 'default' : 'secondary'}>
                        {resume.aiScore}
                      </Badge>
                    ) : <span className="text-sm text-slate-400">—</span>}
                  </TableCell>
                  <TableCell>{new Date(resume.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {resume.fileUrl && (
                      <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">View</Button>
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