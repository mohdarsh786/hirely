'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, CheckCircle, Briefcase, Users2, FileText, Sparkles } from 'lucide-react';
import { RouteGuard } from '@/components/RouteGuard';
import { api } from '@/lib/api';

function HRInterviewsContent() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [interviewCreated, setInterviewCreated] = useState(false);
  const [creatingInterview, setCreatingInterview] = useState(false);
  const [interviewId, setInterviewId] = useState<string>('');
  const [candidateId, setCandidateId] = useState<string>('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleCreateInterview = async () => {
    if (!candidateEmail || !candidateName || !jobRole) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingInterview(true);
    try {
      // First, create or find the candidate
      const candidateResponse = await api.candidates.create({
        name: candidateName,
        email: candidateEmail,
        appliedRole: jobRole,
      });

      const newCandidateId = candidateResponse.candidate.id;
      setCandidateId(newCandidateId);

      // If resume is provided, upload it
      if (resumeFile) {
        await api.resumes.upload(newCandidateId, resumeFile);
      }

      // Start the interview
      const interviewResponse = await api.interviews.start(newCandidateId, jobRole);
      
      setInterviewId(interviewResponse.interviewId);
      setInterviewCreated(true);
    } catch (error: any) {
      console.error('Failed to create interview:', error);
      alert(error?.message || 'Failed to create interview. Please try again.');
    } finally {
      setCreatingInterview(false);
    }
  };

  const handleStartDemo = () => {
    if (interviewId) {
      router.push(`/hr-interviews/live/${interviewId}`);
    }
  };

  const handleSendInvite = async () => {
    if (!interviewId || !candidateEmail || !candidateId) return;
    
    setSendingInvite(true);
    try {
      await api.invites.createCandidate({
        candidateId,
        interviewId,
        email: candidateEmail,
        expiresInDays: 7,
      });
      
      alert(`✅ Interview invitation sent to ${candidateEmail}`);
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      alert(error?.message || 'Failed to send invitation email');
    } finally {
      setSendingInvite(false);
    }
  };

  const resetForm = () => {
    setInterviewCreated(false);
    setCandidateName('');
    setCandidateEmail('');
    setJobRole('');
    setJobDescription('');
    setResumeFile(null);
    setInterviewId('');
    setCandidateId('');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI-Powered HR Interviews</h1>
        <p className="text-muted-foreground">
          Create personalized behavioral interviews with AI evaluation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Setup Interview */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Interview</CardTitle>
            <CardDescription>
              Enter candidate details to generate AI interview questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Candidate Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                disabled={interviewCreated}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Candidate Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="candidate@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                disabled={interviewCreated}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Job Role <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role"
                placeholder="e.g., Software Engineer, Product Manager"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                disabled={interviewCreated}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job">Job Description (Optional)</Label>
              <Textarea
                id="job"
                placeholder="Enter key responsibilities and requirements..."
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={interviewCreated}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Upload Resume (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={interviewCreated}
                />
                {resumeFile && (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>
              {resumeFile && (
                <p className="text-xs text-green-600">✓ {resumeFile.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                PDF, DOC, or DOCX (Max 5MB)
              </p>
            </div>

            {!interviewCreated ? (
              <Button
                onClick={handleCreateInterview}
                className="w-full"
                disabled={!candidateEmail || !candidateName || !jobRole || creatingInterview}
              >
                {creatingInterview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Interview...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Interview
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={handleStartDemo} className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Live Interview
                </Button>
                <Button 
                  onClick={handleSendInvite} 
                  variant="secondary" 
                  className="w-full"
                  disabled={sendingInvite}
                >
                  {sendingInvite ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Email...
                    </>
                  ) : (
                    'Send Email Invite'
                  )}
                </Button>
                <Button onClick={resetForm} variant="outline" className="w-full">
                  Create Another Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Demo Preview */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>AI analyzes and generates personalized questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {interviewCreated ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Interview Created Successfully!</span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    AI Generated Interview For:
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{candidateName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{jobRole}</span>
                    </div>
                    {resumeFile && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{resumeFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Interview Features:
                  </h3>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>✓ Dynamic question generation</li>
                    <li>✓ Real-time AI evaluation</li>
                    <li>✓ Adaptive difficulty levels</li>
                    <li>✓ Detailed feedback & scoring</li>
                    <li>✓ Complete transcript recording</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Candidate Analysis</p>
                      <p className="text-xs text-muted-foreground">
                        AI analyzes role requirements and resume
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Smart Questions</p>
                      <p className="text-xs text-muted-foreground">
                        Generates behavioral & situational questions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Live Evaluation</p>
                      <p className="text-xs text-muted-foreground">
                        Real-time scoring with detailed feedback
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        4
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Final Report</p>
                      <p className="text-xs text-muted-foreground">
                        Comprehensive results with recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI-Powered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Intelligent question generation based on job requirements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Auto Scoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Automatic evaluation with detailed feedback for each answer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Resume Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Extracts skills and experience from uploaded resumes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users2 className="h-4 w-4 text-orange-600" />
              Behavioral Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Assesses cultural fit and soft skills effectively
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function HRInterviewsPage() {
  return (
    <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER']}>
      <HRInterviewsContent />
    </RouteGuard>
  );
}
