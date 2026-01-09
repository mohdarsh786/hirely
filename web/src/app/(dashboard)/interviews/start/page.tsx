'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { InterviewActiveDoodle } from '@/components/doodles/InterviewActiveDoodle';

import { Suspense } from 'react';

function StartInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [questionCount, setQuestionCount] = useState(0);

  const startInterview = async () => {
    if (!candidateId) return;

    setLoading(true);
    try {
      const result = await api.interviews.start(candidateId);
      setInterviewId(result.interviewId);
      setCurrentQuestion(result.question);
      setQuestionCount(1);
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      alert(`Failed to start interview: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!interviewId || !answer.trim()) return;

    setLoading(true);
    try {
      const result = await api.interviews.answer(interviewId, answer);
      setFeedback({
        score: result.score,
        feedback: result.feedback,
      });

      if (result.nextQuestion) {
        setTimeout(() => {
          setCurrentQuestion(result.nextQuestion);
          setAnswer('');
          setFeedback(null);
          setQuestionCount((c) => c + 1);
          setLoading(false);
        }, 3000);
      } else {
        setTimeout(() => {
          finalize();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setLoading(false);
    }
  };

  const finalize = async () => {
    if (!interviewId) return;

    setLoading(true);
    try {
      const result = await api.interviews.finalize(interviewId);
      router.push(`/interviews/${result.interview.id}`);
    } catch (error) {
      console.error('Failed to finalize interview:', error);
      setLoading(false);
    }
  };

  if (!candidateId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">No candidate selected</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">AI Interview</h1>
        <p className="mt-1 text-sm text-slate-500">
          {interviewId
            ? `Question ${questionCount} — Answer thoughtfully`
            : 'Begin the AI-powered interview session'}
        </p>
      </div>

      {!interviewId ? (
        <div className="max-w-2xl">
          {/* Decorative Banner */}
          <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-200">
            <div className="flex items-center justify-center py-8">
              <InterviewActiveDoodle className="h-48 w-full max-w-md opacity-90" />
            </div>
          </div>
          
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50">
              <CardTitle>Start Interview</CardTitle>
              <CardDescription>
                The AI will ask role-specific questions and evaluate responses in
                real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={startInterview} disabled={loading} className="bg-slate-900 hover:bg-slate-800">
                {loading ? 'Starting...' : 'Begin Interview'}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          {currentQuestion && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    Question
                  </CardTitle>
                  <Badge className="bg-blue-600">{questionCount}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-900" data-testid="interview-question">{currentQuestion}</p>
              </CardContent>
            </Card>
          )}

          {feedback && (
            <Card className="border-green-200 bg-green-50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-green-900">
                    Evaluation
                  </CardTitle>
                  <Badge variant={feedback.score >= 70 ? 'default' : 'secondary'} className="bg-green-600">
                    Score: {feedback.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800">Feedback: {feedback.feedback}</p>
              </CardContent>
            </Card>
          )}

          {!feedback && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-base font-semibold">
                  Your Answer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  name="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-32"
                  disabled={loading}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={submitAnswer}
                    disabled={loading || !answer.trim()}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {loading ? 'Processing...' : 'Submit Answer'}
                  </Button>
                  <Button variant="outline" onClick={finalize} className="border-slate-300">
                    End Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function StartInterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StartInterviewContent />
    </Suspense>
  );
}
