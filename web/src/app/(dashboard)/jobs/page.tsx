'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { Job } from '@/types';
import { PlusIcon, Briefcase, Trash2 } from 'lucide-react';

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOrgSetup, setNeedsOrgSetup] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { jobs: data } = await api.jobs.list();
      setJobs(data);
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      if (error.message && error.message.includes('organization')) {
        setNeedsOrgSetup(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await api.jobs.delete(id);
      setJobs(jobs.filter(j => j.id !== id));
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      {needsOrgSetup && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-orange-800 font-medium">⚠️ Organization Setup Required</p>
          <p className="text-sm text-orange-600 mt-1">
            You need to complete{' '}
            <a href="/organization-setup" className="underline font-medium hover:text-orange-700">
              organization setup
            </a>{' '}
            before you can create jobs.
          </p>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Positions</h1>
          <p className="text-slate-600 mt-1">Manage job openings and requirements</p>
        </div>
        <Link href="/jobs/new">
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Create Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs created yet</h3>
            <p className="text-slate-600 text-center mb-4">
              Create your first job position to start adding candidates
            </p>
            <Link href="/jobs/new">
              <Button>Create First Job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {job.experienceYears ? `${job.experienceYears}+ years experience` : 'Experience not specified'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {job.description}
                  </p>
                )}
                
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 5).map((skill: string) => (
                      <span key={skill} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 5 && (
                      <span className="px-2 py-1 bg-slate-100 text-xs text-slate-600">
                        +{job.requiredSkills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Link href={`/candidates/new`}>
                    <Button variant="outline" size="sm">Add Candidate</Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
