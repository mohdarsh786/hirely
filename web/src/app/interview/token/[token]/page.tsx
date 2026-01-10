'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Interview {
  id: string;
  candidateId: string;
  status: string;
  scheduledAt?: string;
  durationMinutes?: number;
  token: string;
  questions?: any[];
  answers?: any[];
}

interface Candidate {
  id: string;
  name: string;
  email?: string | null;
  appliedRole?: string | null;
}

interface Question {
  id: string;
  question: string;
  expectedAnswer?: string;
  difficulty?: string;
}

export default function PublicInterviewPage() {
    const params = useParams();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [interview, setInterview] = useState<Interview | null>(null);
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; score?: number; feedback?: string }>>([]);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInterview();
    }, [token]);

    const fetchInterview = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/interview/token/${token}`);
            
            if (!response.ok) {
                setError('Interview not found or link is invalid');
                setLoading(false);
                return;
            }

            const data = await response.json();
            setInterview(data.interview);
            setCandidate(data.candidate);
            
            // Check if interview is already in progress or completed
            if (data.interview.status === 'in_progress' && data.questions) {
                setQuestions(data.questions);
            } else if (data.interview.status === 'completed') {
                setCompleted(true);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch interview:', err);
            setError('Failed to load interview');
            setLoading(false);
        }
    };

    const startInterview = async () => {
        if (!interview) return;
        
        setStarting(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/interview/${interview.id}/start`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to start interview');
            }

            const data = await response.json();
            
            setInterview({ ...interview, status: 'in_progress' });
            setQuestions(data.questions || []);
            setStarting(false);
        } catch (err) {
            console.error('Failed to start interview:', err);
            setError('Failed to start interview. Please try again.');
            setStarting(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim() || !interview || !questions[currentQuestionIndex]) return;

        setSubmitting(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/interview/${interview.id}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: questions[currentQuestionIndex].id,
                    answer: answer.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }

            const data = await response.json();
            
            // Save answer with score
            setAnswers([...answers, {
                questionId: questions[currentQuestionIndex].id,
                answer: answer.trim(),
                score: data.score,
                feedback: data.feedback,
            }]);

            setAnswer('');

            // Move to next question or complete
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                // Complete the interview
                await completeInterview();
            }

            setSubmitting(false);
        } catch (err) {
            console.error('Failed to submit answer:', err);
            setError('Failed to submit answer. Please try again.');
            setSubmitting(false);
        }
    };

    const completeInterview = async () => {
        if (!interview) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            await fetch(`${API_URL}/interview/${interview.id}/complete`, {
                method: 'POST',
            });

            setCompleted(true);
        } catch (err) {
            console.error('Failed to complete interview:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !interview || !candidate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <AlertCircle className="h-6 w-6" />
                            <CardTitle>Error</CardTitle>
                        </div>
                        <CardDescription>{error || 'Interview not found'}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <Card className="max-w-2xl w-full shadow-xl">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle2 className="h-8 w-8" />
                            <CardTitle className="text-2xl">Interview Completed!</CardTitle>
                        </div>
                        <CardDescription>Thank you for your time, {candidate.name}!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-700">
                            Your responses have been recorded and will be reviewed by our recruitment team.
                            We'll be in touch soon regarding the next steps.
                        </p>
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                            <p className="text-sm text-blue-900">
                                <strong>What's Next:</strong>
                            </p>
                            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                                <li>Your answers are being evaluated by our AI system</li>
                                <li>A recruiter will review your responses</li>
                                <li>You'll receive feedback within 3-5 business days</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show welcome screen if interview is scheduled but not started
    if (interview.status === 'scheduled') {
        const scheduledTime = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
        const now = new Date();
        const isTimeToStart = !scheduledTime || now >= scheduledTime;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 p-4">
                <Card className="max-w-2xl w-full shadow-xl">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Video className="h-8 w-8" />
                            <CardTitle className="text-2xl">Welcome, {candidate.name}!</CardTitle>
                        </div>
                        <CardDescription>AI-Powered Interview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <p className="font-medium text-slate-900">Position: {candidate.appliedRole || 'Not specified'}</p>
                            {candidate.email && <p className="text-sm text-slate-600">Email: {candidate.email}</p>}
                        </div>

                        {scheduledTime && (
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-blue-900">
                                    <Clock className="h-5 w-5" />
                                    <p className="font-medium">Scheduled Time:</p>
                                </div>
                                <p className="text-blue-800">{scheduledTime.toLocaleString()}</p>
                                {interview.durationMinutes && (
                                    <p className="text-sm text-blue-700">Duration: {interview.durationMinutes} minutes</p>
                                )}
                            </div>
                        )}

                        {!isTimeToStart ? (
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                                <p className="text-amber-800">
                                    The interview will be available at the scheduled time. Please check back then.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-lg bg-slate-100 border border-slate-200 p-4 space-y-2">
                                    <p className="font-medium text-slate-900">Before you start:</p>
                                    <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                                        <li>Find a quiet place with good internet connection</li>
                                        <li>Have your resume ready for reference</li>
                                        <li>Answer questions thoughtfully and honestly</li>
                                        <li>You'll have {interview.durationMinutes || 30} minutes to complete</li>
                                        <li>Each answer will be evaluated by AI in real-time</li>
                                    </ul>
                                </div>

                                <Button 
                                    onClick={startInterview} 
                                    disabled={starting}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                >
                                    {starting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating Questions...
                                        </>
                                    ) : (
                                        'Start Interview'
                                    )}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show interview in progress
    if (interview.status === 'in_progress' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                                    <Badge variant="outline" className="mt-2">
                                        {currentQuestion.difficulty || 'medium'} difficulty
                                    </Badge>
                                </div>
                                <span className="text-sm font-medium text-slate-600">{Math.round(progress)}% Complete</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6">
                                <p className="text-lg text-slate-900 leading-relaxed">{currentQuestion.question}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Your Answer:</label>
                                <Textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type your detailed answer here... Be specific and provide examples where possible."
                                    rows={8}
                                    className="resize-none"
                                />
                                <p className="text-xs text-slate-500">
                                    💡 Tip: Provide detailed, thoughtful responses with examples for better scores
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    onClick={submitAnswer}
                                    disabled={!answer.trim() || submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Evaluating...
                                        </>
                                    ) : (
                                        currentQuestionIndex === questions.length - 1 ? '✓ Submit & Finish' : 'Next Question →'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center text-sm text-slate-600">
                        Questions answered: {currentQuestionIndex} / {questions.length}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Loading Interview...</CardTitle>
                </CardHeader>
            </Card>
        </div>
    );
}
