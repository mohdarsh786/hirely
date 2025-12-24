'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RouteGuard } from '@/components/RouteGuard';
import { EmptyStateDoodle } from '@/components/doodles/EmptyStateDoodle';
import { CandidateProfileDoodle } from '@/components/doodles/CandidateProfileDoodle';
import { api, type Candidate, type Resume, type Interview } from '@/lib/api';

function CandidateDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    api.candidates
      .get(id)
      .then((data) => {
        setCandidate(data.candidate);
        setResumes(data.resumes);
        setInterviews(data.interviews);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!candidate || !confirm('Delete this candidate?')) return;

    try {
      await api.candidates.delete(candidate.id);
      router.push('/candidates');
    } catch (error) {
      console.error('Failed to delete candidate:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading candidate...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Candidate not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/candidates"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back to candidates
          </Link>
        </div>
        
        {/* Profile Header with Doodle */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 mb-6">
          <div className="flex items-center justify-between p-6">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-slate-900">
                {candidate.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {candidate.email || 'No email provided'}
              </p>
              {candidate.appliedRole && (
                <Badge className="mt-3 bg-blue-100 text-blue-700 border-0">
                  {candidate.appliedRole}
                </Badge>
              )}
            </div>
            <CandidateProfileDoodle className="h-32 w-40 opacity-90" />
          </div>
        </div>
        
        <div className="flex items-start justify-between">
          <div />
          <Button variant="outline" onClick={handleDelete} className="border-red-200 text-red-600 hover:bg-red-50">
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-base font-semibold">
                Candidate Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Applied Role</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {candidate.appliedRole || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Experience</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {candidate.experienceYears !== null
                      ? `${candidate.experienceYears} years`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Added</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(candidate.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50">
              <div>
                <CardTitle className="text-base font-semibold">Resumes</CardTitle>
                <CardDescription>Uploaded resume files</CardDescription>
              </div>
              <Link href={`/resumes/upload?candidateId=${candidate.id}`}>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800">Upload Resume</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <EmptyStateDoodle className="h-32 w-32 opacity-80" />
                  <p className="mt-2 text-sm text-slate-500">No resumes uploaded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumes.map((resume) => (
                      <TableRow key={resume.id}>
                        <TableCell className="text-sm">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {resume.aiScore ? (
                            <Badge
                              variant={resume.aiScore >= 70 ? 'default' : 'secondary'}
                            >
                              {resume.aiScore}%
                            </Badge>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
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
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50">
              <div>
                <CardTitle className="text-base font-semibold">
                  Interviews
                </CardTitle>
                <CardDescription>AI-powered interview sessions</CardDescription>
              </div>
              <Link href={`/interviews/start?candidateId=${candidate.id}`}>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800">Start Interview</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {interviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <EmptyStateDoodle className="h-32 w-32 opacity-80" />
                  <p className="mt-2 text-sm text-slate-500">No interviews conducted</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell className="text-sm">
                          {new Date(interview.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {interview.finalRating ? (
                            <Badge
                              variant={
                                interview.finalRating >= 7 ? 'default' : 'secondary'
                              }
                            >
                              {interview.finalRating}/10
                            </Badge>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {interview.transcript.filter((e) => e.type === 'question')
                            .length}
                        </TableCell>
                        <TableCell>
                          <Link href={`/interviews/${interview.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/resumes/upload?candidateId=${candidate.id}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Upload Resume
                </Button>
              </Link>
              <Link href={`/interviews/start?candidateId=${candidate.id}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Start Interview
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  return (
    <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER']}>
      <CandidateDetailPageContent />
    </RouteGuard>
  );
}
