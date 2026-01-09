'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// 1. HIGH-PERFORMANCE ICON IMPORTS
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Play from 'lucide-react/dist/esm/icons/play';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

// 2. DYNAMIC SUB-COMPONENTS
const HowItWorksCard = dynamic(() => import('./_components/HowItWorks'), { ssr: true });
const FeaturesGrid = dynamic(() => import('./_components/FeaturesGrid'), { ssr: true });

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RouteGuard } from '@/components/RouteGuard';
import { api } from '@/lib/api';

function HRInterviewsContent() {
  const router = useRouter();
  
  // ALL YOUR ORIGINAL STATE - DO NOT REMOVE
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
      const candidateResponse = await api.candidates.create({
        name: candidateName,
        email: candidateEmail,
        appliedRole: jobRole,
      });
      const newCandidateId = candidateResponse.candidate.id;
      setCandidateId(newCandidateId);
      if (resumeFile) await api.resumes.upload(newCandidateId, resumeFile);
      const interviewResponse = await api.interviews.start(newCandidateId, jobRole);
      setInterviewId(interviewResponse.interviewId);
      setInterviewCreated(true);
    } catch (error: any) {
      alert(error?.message || 'Failed to create interview.');
    } finally {
      setCreatingInterview(false);
    }
  };

  const handleStartDemo = () => {
    if (interviewId) router.push(`/hr-interviews/live/${interviewId}`);
  };

  const handleSendInvite = async () => {
    if (!interviewId || !candidateEmail || !candidateId) return;
    setSendingInvite(true);
    try {
      await api.invites.createCandidate({
        candidateId, interviewId, email: candidateEmail, expiresInDays: 7,
      });
      alert(`✅ Invitation sent to ${candidateEmail}`);
    } catch (error: any) {
      alert('Failed to send invitation email');
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
        <p className="text-muted-foreground">Create personalized behavioral interviews with AI evaluation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Setup Interview</CardTitle>
            <CardDescription>Enter candidate details to generate AI questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Candidate Name <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="John Doe" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} disabled={interviewCreated} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Candidate Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" placeholder="candidate@example.com" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} disabled={interviewCreated} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Job Role <span className="text-red-500">*</span></Label>
              <Input id="role" placeholder="e.g., Software Engineer" value={jobRole} onChange={(e) => setJobRole(e.target.value)} disabled={interviewCreated} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Upload Resume (Optional)</Label>
              <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} disabled={interviewCreated} />
            </div>

            {!interviewCreated ? (
              <Button onClick={handleCreateInterview} className="w-full" disabled={!candidateEmail || !candidateName || !jobRole || creatingInterview}>
                {creatingInterview ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate AI Interview</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={handleStartDemo} className="w-full" size="lg"><Play className="h-4 w-4 mr-2" /> Start Live Interview</Button>
                <Button onClick={handleSendInvite} variant="secondary" className="w-full" disabled={sendingInvite}>
                  {sendingInvite ? 'Sending...' : 'Send Email Invite'}
                </Button>
                <Button onClick={resetForm} variant="outline" className="w-full">Create Another</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PASSING THE STATE TO THE NEW COMPONENT */}
        <HowItWorksCard 
          interviewCreated={interviewCreated} 
          candidateName={candidateName} 
          jobRole={jobRole} 
          resumeName={resumeFile?.name} 
        />
      </div>

      <FeaturesGrid />
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