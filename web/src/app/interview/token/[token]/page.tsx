'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type Interview, type Candidate } from '@/lib/api';
import { InterviewScheduleDoodle } from '@/components/doodles/InterviewScheduleDoodle';
import { Check, X, Loader2 } from 'lucide-react';

export default function PublicInterviewPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [interview, setInterview] = useState<Interview | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const loadInterview = async () => {
        try {
            const data = await api.public.getInterview(token);
            setCandidate(data.candidate);
            setInterview(data.interview);
            
            // If interview exists, redirect to live interview page
            if (data.interview?.id) {
                router.push(`/hr-interviews/live/${data.interview.id}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid or expired interview link');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInterview();
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [token]);

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim()) return;

        setSubmitting(true);
        try {
            await api.public.submitAnswer(token, {
                answer: currentAnswer,
                questionIndex: interview?.transcript?.length || 0,
            });

            // Reload interview to get next question
            await loadInterview();
            setCurrentAnswer('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit answer');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-600">Loading interview...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <div className="rounded-full bg-red-100 p-3">
                                <X className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-center text-xl">
                            Invalid Interview Link
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-slate-600">{error}</p>
                        <p className="mt-4 text-center text-sm text-slate-500">
                            Please contact the recruiter for a new interview link.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                <Card className="w-full max-w-2xl shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                            <InterviewScheduleDoodle className="h-40 w-full max-w-md" />
                        </div>
                        <CardTitle className="text-center text-3xl font-bold text-slate-900">
                            Welcome, {candidate?.name}!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-6">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <div className="h-3 w-3 bg-amber-500 rounded-full"></div>
                                <p className="text-lg font-semibold text-amber-900">
                                    Interview Not Yet Started
                                </p>
                            </div>
                            <p className="text-slate-700 mb-4">
                                Your invitation has been received, but the interview hasn't been set up yet. Please contact the recruiter or check back later.
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                            <p className="text-sm text-slate-600 mb-2">
                                <span className="font-semibold text-slate-900">Position:</span> {candidate?.appliedRole || 'General Position'}
                            </p>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-slate-900">Email:</span> {candidate?.email}
                            </p>
                        </div>

                        <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-blue-900 mb-2">📋 Next Steps:</p>
                            <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                                <li>The recruiter needs to generate interview questions for you</li>
                                <li>You'll receive a new link once the interview is ready</li>
                                <li>Or contact your recruiter for immediate assistance</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isCompleted = interview.status === 'completed';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <div className="mx-auto max-w-3xl py-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">Interview for {candidate?.name}</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">
                                    Position: {candidate?.appliedRole || 'General'}
                                </p>
                            </div>
                            {isCompleted && (
                                <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Completed</span>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {isCompleted ? (
                            <div className="rounded-lg bg-green-50 p-6 text-center">
                                <Check className="mx-auto h-12 w-12 text-green-600 mb-4" />
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    Interview Completed!
                                </h3>
                                <p className="text-green-700">
                                    Thank you for completing the interview. The recruiter will review your responses and get back to you soon.
                                </p>
                                {interview.finalRating && (
                                    <div className="mt-4 text-sm text-green-600">
                                        Score: {interview.finalRating}/10
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="rounded-lg border border-slate-200 bg-white p-6">
                                    <p className="text-sm font-medium text-slate-500 mb-2">Current Question:</p>
                                    <p className="text-slate-900">
                                        This is a placeholder question. The actual interview flow would show questions from the AI interviewer.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        Your Answer
                                    </label>
                                    <textarea
                                        className="w-full min-h-[150px] rounded-lg border border-slate-300 p-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Type your answer here..."
                                        value={currentAnswer}
                                        onChange={(e) => setCurrentAnswer(e.target.value)}
                                        disabled={submitting}
                                    />
                                    <Button
                                        onClick={handleSubmitAnswer}
                                        disabled={!currentAnswer.trim() || submitting}
                                        className="w-full"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Answer'}
                                    </Button>
                                </div>

                                {interview.transcript && interview.transcript.length > 0 && (
                                    <div className="mt-6">
                                        <p className="text-sm font-medium text-slate-700 mb-3">
                                            Progress: {interview.transcript.filter(t => t.type === 'answer').length} answers submitted
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
