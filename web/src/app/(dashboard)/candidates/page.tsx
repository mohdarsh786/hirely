'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api, type Candidate } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import { EmptyStateDoodle } from '@/components/doodles/EmptyStateDoodle';
import { Send } from 'lucide-react';

function CandidatesPageContent() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    api.candidates
      .list()
      .then((data) => {
        setCandidates(data.candidates);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleInvite = async (candidate: Candidate) => {
    if (!candidate.email) return;

    setInviting(candidate.id);
    try {
      await api.invites.createCandidate({
        candidateId: candidate.id,
        email: candidate.email,
        expiresInDays: 7
      });
      alert(`Invite sent to ${candidate.email}`);
    } catch (error) {
      console.error('Failed to invite:', error);
      alert('Failed to send invite');
    } finally {
      setInviting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Candidates</h1>
        <Link href="/candidates/new">
          <Button>New Candidate</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <EmptyStateDoodle className="h-40 w-40 opacity-80" />
                    <p className="mt-4 text-sm text-slate-500">No candidates found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="font-medium text-slate-900 hover:text-slate-700"
                    >
                      {candidate.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {candidate.email || '—'}
                  </TableCell>
                  <TableCell>
                    {candidate.appliedRole ? (
                      <Badge variant="secondary">{candidate.appliedRole}</Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {candidate.experienceYears !== null
                      ? `${candidate.experienceYears} years`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(candidate.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {candidate.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={inviting === candidate.id}
                          onClick={() => handleInvite(candidate)}
                        >
                          {inviting === candidate.id ? (
                            <span className="animate-spin">⌛</span>
                          ) : (
                            <>
                              <Send className="mr-2 h-3 w-3" />
                              Invite
                            </>
                          )}
                        </Button>
                      )}
                      <Link href={`/candidates/${candidate.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER']}>
      <CandidatesPageContent />
    </RouteGuard>
  );
}
