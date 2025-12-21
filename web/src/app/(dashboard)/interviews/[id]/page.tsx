'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { InterviewScheduleDoodle } from '@/components/doodles/InterviewScheduleDoodle';
import { api, type Interview, type TranscriptEntry } from '@/lib/api';

export default function InterviewDetailPage() {
  const params = useParams();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    api.interviews
      .get(id)
      .then((data) => {
        setInterview(data.interview);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading interview...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Interview not found</p>
      </div>
    );
  }

  const questions = interview.transcript.filter((e) => e.type === 'question');
  const avgScore =
    interview.scores.perQuestion && interview.scores.perQuestion.length > 0
      ? Math.round(
          interview.scores.perQuestion.reduce((a, b) => a + b, 0) /
            interview.scores.perQuestion.length
        )
      : null;

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href={`/candidates/${interview.candidateId}`}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back to candidate
          </Link>
        </div>
        
        {/* Header Banner */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-200">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Interview Details
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(interview.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </p>
            </div>
            <InterviewScheduleDoodle className="h-28 w-32 opacity-90" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-base font-semibold">Transcript</CardTitle>
              <CardDescription>
                Complete interview conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4" data-testid="interview-transcript">
                  {interview.transcript.map((entry, index) => (
                    <TranscriptItem key={index} entry={entry} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Final Rating</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {interview.finalRating ? `${interview.finalRating}/10` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Average Score</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {avgScore !== null ? `${avgScore}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Questions Asked</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {questions.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {interview.aiFeedback && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-blue-50/50">
                <CardTitle className="text-base font-semibold">
                  AI Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{interview.aiFeedback}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TranscriptItem({ entry }: { entry: TranscriptEntry }) {
  if (entry.type === 'question') {
    return (
      <div className="space-y-2" data-testid="transcript-question">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Question</Badge>
          <span className="text-xs text-slate-400">
            {new Date(entry.at).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-slate-900">{entry.text}</p>
      </div>
    );
  }

  if (entry.type === 'answer') {
    return (
      <div className="space-y-2 rounded-lg bg-slate-50 p-4" data-testid="transcript-answer">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Answer</Badge>
          <span className="text-xs text-slate-400">
            {new Date(entry.at).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-slate-700">{entry.text}</p>
      </div>
    );
  }

  if (entry.type === 'eval') {
    return (
      <div className="space-y-2 border-l-2 border-slate-200 pl-4">
        <div className="flex items-center gap-2">
          <Badge>Evaluation</Badge>
          <Badge variant={entry.score >= 70 ? 'default' : 'secondary'}>
            {entry.score}%
          </Badge>
          <span className="text-xs text-slate-400">
            {new Date(entry.at).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-slate-600">{entry.feedback}</p>
      </div>
    );
  }

  return null;
}
