'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Job } from '@/types';

const AddCandidateDoodle = dynamic(
  () => import('@/components/doodles/AddCandidateDoodle').then(mod => mod.AddCandidateDoodle),
  { ssr: false, loading: () => <div className="h-32 w-32 bg-slate-100 animate-pulse rounded-full" /> }
);

export default function NewCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    experienceYears: '',
    jobId: '', // Only job selection - skills come from job
  });

  // Fetch available jobs on mount (Phase 4: Parallel optimization)
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { jobs } = await api.jobs.list();
        setJobs(jobs.filter((j) => j.status === 'active'));
      } catch (error: any) {
        console.error('Failed to fetch jobs:', error);
        setError(error.message || 'Failed to load jobs. Please ensure you have completed organization setup.');
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobId) {
      alert('Please select a job position');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: formData.name,
        email: formData.email || undefined,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
        jobId: formData.jobId,
      };

      const result = await api.candidates.create(data);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/candidates/${result.candidate.id}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to create candidate:', error);
      setLoading(false);
    }
  };

  const selectedJob = jobs.find((j) => j.id === formData.jobId);

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-200">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Candidate</h1>
            <p className="text-slate-600 mt-1">Create a candidate profile for a specific job position</p>
          </div>
          <AddCandidateDoodle className="h-32 w-32 opacity-90" />
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-800 font-medium">✓ Candidate created successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800 font-medium">⚠️ {error}</p>
          <p className="text-sm text-red-600 mt-1">
            Please complete{' '}
            <a href="/organization-setup" className="underline font-medium hover:text-red-700">
              organization setup
            </a>{' '}
            first.
          </p>
        </div>
      )}

      <Card className="max-w-2xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
          <CardDescription>Basic details - job requirements are pre-defined</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job">
                Job Position <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.jobId}
                onValueChange={(value) => setFormData({ ...formData, jobId: value })}
                disabled={loadingJobs}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingJobs ? 'Loading jobs...' : 'Select a job position'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                      {job.experienceYears && ` (${job.experienceYears}+ years)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {jobs.length === 0 && !loadingJobs && (
                <p className="text-sm text-orange-600">
                  No active jobs found.{' '}
                  <a href="/jobs/new" className="underline hover:text-orange-700">
                    Create a job first
                  </a>
                </p>
              )}
            </div>

            {selectedJob && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
                <p className="font-medium text-blue-900">📋 Job Requirements:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-800 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {selectedJob.experienceYears && (
                  <p className="text-sm text-blue-700 mt-2">
                    💼 Experience: {selectedJob.experienceYears}+ years required
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="experience">Candidate's Experience (years)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                placeholder="5"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !formData.jobId}>
                {loading ? 'Creating...' : 'Create Candidate'}
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