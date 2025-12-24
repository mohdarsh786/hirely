'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, ArrowRight, Clock, User, Briefcase } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/loading';
import { RouteGuard } from '@/components/RouteGuard';

interface TranscriptEntry {
  type: string;
  text?: string;
  score?: number;
  feedback?: string;
  at: string;
}

interface InterviewData {
  interview: {
    id: string;
    candidateId: string;
    transcript: TranscriptEntry[];
    finalRating: number | null;
    aiFeedback: string | null;
  };
}

interface CandidateData {
  candidate: {
    name: string;
    email: string | null;
    appliedRole: string | null;
  };
  resumes?: any[];
  interviews?: any[];
}

function LiveInterviewContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const interviewId = resolvedParams.id;

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<string>('');
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: interviewData, loading, error, refetch } = useApi<InterviewData>(
    () => api.interviews.get(interviewId),
    { immediate: true }
  );

  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  
  useEffect(() => {
    if (interviewData?.interview.candidateId) {
      api.candidates.get(interviewData.interview.candidateId)
        .then(setCandidateData)
        .catch(console.error);
    }
  }, [interviewData?.interview.candidateId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const interview = interviewData?.interview;
  const candidate = candidateData?.candidate;
  
  const transcript = interview?.transcript || [];
  const questions = transcript.filter((t) => t.type === 'question' && t.text);
  const answers = transcript.filter((t) => t.type === 'answer' && t.text);
  const currentQuestionIndex = questions.length - 1;
  const currentQuestion = questions[currentQuestionIndex];

  const isCompleted = interview?.finalRating !== null && interview?.finalRating !== undefined;
  const progress = questions.length > 0 ? ((answers.length + 1) / questions.length) * 100 : 0;

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !interviewId) return;

    setSubmitting(true);
    setCurrentFeedback('');

    try {
      const response = await api.interviews.answer(interviewId, answer.trim());
      
      // Show feedback temporarily
      if (response.evaluation) {
        setCurrentFeedback(response.evaluation.feedback);
      }

      // Refetch interview data to get updated transcript
      await refetch();
      
      // Clear answer input
      setAnswer('');

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setCurrentFeedback('');
      }, 3000);
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      alert(error?.message || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer before completing the interview');
      return;
    }

    setSubmitting(true);
    try {
      // First submit the final answer
      await api.interviews.answer(interviewId, answer.trim());
      
      // Then finalize the interview
      await api.interviews.finalize(interviewId);
      
      // Refetch to get final results
      await refetch();
    } catch (error: any) {
      console.error('Failed to complete interview:', error);
      alert(error?.message || 'Failed to complete interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader text="Loading interview..." />;
  }

  if (error || !interview) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load interview. Please try again.</p>
            <Button onClick={() => router.push('/hr-interviews')} className="mt-4">
              Back to HR Interviews
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Interview Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Interview Details</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Candidate:</span>{' '}
                  <span className="font-medium">{candidate?.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Role:</span>{' '}
                  <span className="font-medium">{candidate?.appliedRole}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Questions Answered:</span>{' '}
                  <span className="font-medium">{answers.length}</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Overall Score</h4>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-green-600">
                  {interview.finalRating || 0}
                </div>
                <div className="flex-1">
                  <Progress value={interview.finalRating || 0} className="h-3" />
                </div>
              </div>
              {interview.aiFeedback && (
                <p className="mt-4 text-sm text-muted-foreground">{interview.aiFeedback}</p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Question-by-Question Breakdown</h4>
              {transcript
                .filter((t) => t.type === 'eval')
                .map((evaluation, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Question {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          {evaluation.score}/10
                        </span>
                      </div>
                    </div>
                    <Progress value={(evaluation.score || 0) * 10} className="h-2 mb-2" />
                    {evaluation.feedback && (
                      <p className="text-xs text-muted-foreground">{evaluation.feedback}</p>
                    )}
                  </div>
                ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => router.push('/hr-interviews')} className="flex-1">
                Back to HR Interviews
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/interviews/${interviewId}`)}
                className="flex-1"
              >
                View Full Transcript
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Live HR Interview</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {candidate && (
            <>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {candidate.name}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {candidate.appliedRole}
              </div>
            </>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
              <Badge variant="outline">Behavioral</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
            <p className="text-lg leading-relaxed">{currentQuestion?.text}</p>
          </div>

          {currentFeedback && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-green-900 dark:text-green-100">
                    Answer Evaluated
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {currentFeedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Answer</label>
            <Textarea
              placeholder="Type your answer here... Be specific and provide examples from your experience."
              rows={8}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              {answer.length} characters • AI evaluates clarity, relevance, and depth
            </p>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {answers.length} / {questions.length} questions answered
            </p>

            {answers.length >= questions.length - 1 ? (
              <Button
                onClick={handleCompleteInterview}
                disabled={!answer.trim() || submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Interview
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI Evaluating...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LiveInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER']}>
      <LiveInterviewContent params={params} />
    </RouteGuard>
  );
}
