'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Interview } from '@/types';

export function InterviewsTable({ initialData }: { initialData: Interview[] }) {
  const [interviews, setInterviews] = useState<Interview[]>(initialData);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this interview?')) {
      try {
        await api.interviews.delete(id);
        setInterviews(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const filtered = statusFilter === 'all' 
    ? interviews 
    : interviews.filter(i => i.status === statusFilter);

  return (
    <>
      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((interview) => (
              <TableRow key={interview.id}>
                <TableCell>
                  <Link href={`/interviews/${interview.id}`} className="font-medium hover:underline">
                    Candidate #{interview.candidateId.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                    {interview.status}
                  </Badge>
                </TableCell>
                <TableCell>{interview.finalRating ? `${interview.finalRating}%` : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(interview.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}