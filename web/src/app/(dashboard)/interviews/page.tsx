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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, type Interview } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import { InterviewScheduleDoodle } from '@/components/doodles/InterviewScheduleDoodle';

function InterviewsPageContent() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const data = await api.interviews.list();
      setInterviews(data.interviews || []);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this interview?')) {
      try {
        await api.interviews.delete(id);
        await loadInterviews();
      } catch (error) {
        console.error('Failed to delete interview:', error);
      }
    }
  };

  const filteredInterviews = statusFilter === 'all'
    ? interviews
    : interviews.filter(i => i.status === statusFilter);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading interviews...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Interviews</h1>
        <Link href="/candidates">
          <Button>View Candidates</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Select name="status" value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center text-center">
            <InterviewScheduleDoodle className="h-56 w-56 opacity-80" />
            <p className="mt-4 mb-4 text-sm text-slate-600">
              No interviews found
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
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell>
                    <Link
                      href={`/interviews/${interview.id}`}
                      className="font-medium hover:underline"
                    >
                      Candidate #{interview.candidateId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                      {interview.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {interview.finalRating ? `${interview.finalRating}/10` : '—'}
                  </TableCell>
                  <TableCell>
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(interview.id)}
                    >
                      Delete
                    </Button>
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

export default function InterviewsPage() {
  return (
    <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER']}>
      <InterviewsPageContent />
    </RouteGuard>
  );
}
