'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  Mail, 
  Briefcase, 
  Clock,
  MessageSquare,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Interview, Candidate } from '@/types';
import { ResumeViewer } from './ResumeViewer';

interface InterviewWithDecision extends Interview {
  decision?: 'shortlisted' | 'rejected' | null;
  decisionNote?: string | null;
  decisionAt?: string | null;
  decisionBy?: string | null;
}

interface InterviewReviewProps {
  interview: InterviewWithDecision;
  candidate: Candidate;
  resume: any;
}

export function InterviewReview({ interview, candidate, resume }: InterviewReviewProps) {
  const router = useRouter();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [decision, setDecision] = useState<'shortlisted' | 'rejected' | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const questions = (interview as any)?.questions || [];
  const answers = (interview as any)?.answers || [];

  const handleDecision = async (selectedDecision: 'shortlisted' | 'rejected') => {
    if (submitting) return;
    
    const confirmMessage = selectedDecision === 'shortlisted'
      ? `Are you sure you want to SHORTLIST ${candidate.name}?`
      : `Are you sure you want to REJECT ${candidate.name}?`;
    
    if (!confirm(confirmMessage)) return;

    setSubmitting(true);
    try {
      console.log('[Decision] Starting decision process:', selectedDecision);
      const result = await api.interviews.makeDecision(interview.id, selectedDecision, note || undefined);
      console.log('[Decision] Decision result:', result);
      alert(`Candidate ${selectedDecision} successfully! Email notification has been sent.`);
      router.push('/interviews');
      router.refresh();
    } catch (error: any) {
      console.error('[Decision] Failed to make decision:', error);
      alert(error?.message || 'Failed to process decision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgScore = answers.length > 0
    ? Math.round(answers.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / answers.length)
    : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/interviews')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interviews
        </Button>
        <h1 className="text-3xl font-bold">Interview Performance Review</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Candidate Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Candidate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{candidate.name}</p>
              </div>
              {candidate.email && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="text-sm">{candidate.email}</p>
                </div>
              )}
              {candidate.appliedRole && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Applied Role
                  </p>
                  <p className="font-medium">{candidate.appliedRole}</p>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Overall Score
                </p>
                <p className="text-3xl font-bold text-primary">{avgScore}%</p>
              </div>
              {resume && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowResumeModal(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Decision Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Make Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Optional Note (included in email)
                </label>
                <Textarea
                  placeholder="Add a personalized message for the candidate..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleDecision('shortlisted')}
                  disabled={submitting || interview.decision !== null}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Shortlist Candidate
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDecision('rejected')}
                  disabled={submitting || interview.decision !== null}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Candidate
                </Button>
              </div>
              {interview.decision && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">
                    Decision already made: 
                    <Badge 
                      className="ml-2"
                      variant={interview.decision === 'shortlisted' ? 'default' : 'destructive'}
                    >
                      {interview.decision}
                    </Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Q&A Transcript */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Interview Transcript & Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {answers.length} of {questions.length} questions answered
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {answers.map((answer: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Question {index + 1}</p>
                        <p className="font-medium mt-1">{answer.question}</p>
                      </div>
                      <Badge variant={answer.score >= 70 ? 'default' : answer.score >= 50 ? 'secondary' : 'destructive'}>
                        {answer.score}%
                      </Badge>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Candidate's Answer:</p>
                      <p className="text-sm bg-muted p-3 rounded">{answer.answer}</p>
                    </div>
                    {answer.feedback && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">AI Evaluation:</p>
                        <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded">{answer.feedback}</p>
                      </div>
                    )}
                    {answer.timestamp && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(answer.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && resume && (
        <ResumeViewer
          resume={resume}
          onClose={() => setShowResumeModal(false)}
        />
      )}
    </div>
  );
}
