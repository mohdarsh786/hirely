'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, type Candidate, type Job } from '@/lib/api';
import { Calendar, Clock, User, Briefcase, Star } from 'lucide-react';

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [formData, setFormData] = useState({
    candidateId: '',
    scheduledAt: '',
    durationMinutes: '30',
  });

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { candidates: data } = await api.candidates.list();
        setCandidates(data);
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.candidateId || !formData.scheduledAt) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const data = {
        candidateId: formData.candidateId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        durationMinutes: parseInt(formData.durationMinutes),
      };

      const result = await api.interviews.create(data);
      
      // Show success message
      alert(`Interview scheduled successfully!\n\nInterview ID: ${result.interview.id}`);
      
      router.push('/interviews');
    } catch (error) {
      console.error('Failed to create interview:', error);
      alert('Failed to create interview. Please try again.');
      setLoading(false);
    }
  };

  const selectedCandidate = candidates.find(c => c.id === formData.candidateId);

  // Get minimum datetime (current time)
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Schedule New Interview</h1>
        <p className="text-slate-600 mt-1">Generate an AI-powered interview for a candidate</p>
      </div>

      <Card className="max-w-2xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
          <CardDescription>Select a candidate and schedule the interview time</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="candidate">Select Candidate *</Label>
              <Select
                value={formData.candidateId}
                onValueChange={(value) => setFormData({ ...formData, candidateId: value })}
                disabled={loadingCandidates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCandidates ? "Loading candidates..." : "Choose a candidate"} />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{candidate.name}</span>
                        {candidate.appliedRole && (
                          <span className="text-xs text-slate-500">({candidate.appliedRole})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCandidate && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                <p className="font-medium text-blue-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Candidate Information
                </p>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>Name:</strong> {selectedCandidate.name}</p>
                  {selectedCandidate.email && <p><strong>Email:</strong> {selectedCandidate.email}</p>}
                  {selectedCandidate.appliedRole && (
                    <p className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      <strong>Role:</strong> {selectedCandidate.appliedRole}
                    </p>
                  )}
                  {selectedCandidate.experienceYears !== null && (
                    <p className="flex items-center gap-2">
                      <Star className="h-3 w-3" />
                      <strong>Experience:</strong> {selectedCandidate.experienceYears} years
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule Date & Time *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  required
                  min={minDateTime}
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500">Select when the interview should take place</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Interview Duration (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Select
                  value={formData.durationMinutes}
                  onValueChange={(value) => setFormData({ ...formData, durationMinutes: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes (recommended)</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4 space-y-2">
              <p className="text-sm font-medium text-green-900">✨ AI-Powered Interview Features:</p>
              <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
                <li>Questions generated based on <strong>candidate's resume</strong></li>
                <li>Questions tailored to <strong>job requirements and role</strong></li>
                <li>Automatic <strong>answer evaluation and scoring</strong></li>
                <li>Real-time <strong>feedback for each response</strong></li>
                <li>Final <strong>comprehensive assessment</strong> with recommendations</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !formData.candidateId} className="bg-slate-900 hover:bg-slate-800">
                {loading ? 'Scheduling...' : 'Schedule Interview'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
