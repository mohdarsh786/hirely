'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Trash2, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import type { Interview } from '@/types';

export function InterviewsTable({ initialData }: { initialData: Interview[] }) {
  const [interviews, setInterviews] = useState<Interview[]>(initialData);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this interview?')) {
      try {
        await api.interviews.delete(id);
        setInterviews(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete interview');
      }
    }
  };

  const handleSendInvite = async (id: string) => {
    setSendingInvite(id);
    try {
      const response = await api.interviews.sendInvite(id);
      alert(response.message || 'Interview invitation sent successfully!');
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      alert(error?.message || 'Failed to send interview invitation');
    } finally {
      setSendingInvite(null);
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
                  <div className="flex items-center justify-end gap-2">
                    {interview.status === 'completed' && interview.finalRating ? (
                      <Link href={`/interviews/review/${interview.id}`}>
                        <Button variant="default" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review Performance
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSendInvite(interview.id)}
                        disabled={sendingInvite === interview.id}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        {sendingInvite === interview.id ? 'Sending...' : 'Send Invite'}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(interview.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}