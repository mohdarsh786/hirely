'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';
import { AddCandidateDoodle } from '@/components/doodles/AddCandidateDoodle';

export default function NewCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    appliedRole: '',
    experienceYears: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        email: formData.email || undefined,
        appliedRole: formData.appliedRole || undefined,
        experienceYears: formData.experienceYears
          ? parseInt(formData.experienceYears)
          : undefined,
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

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      {/* Decorative Header Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-200">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Add Candidate</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create a new candidate profile
            </p>
          </div>
          <AddCandidateDoodle className="h-32 w-32 opacity-90" />
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-900">Candidate created successfully!</p>
        </div>
      )}

      <Card className="max-w-2xl shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50">
          <CardTitle>Candidate Information</CardTitle>
          <CardDescription>
            Enter the candidate's basic details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Applied Role</Label>
              <Input
                id="role"
                name="appliedRole"
                value={formData.appliedRole}
                onChange={(e) =>
                  setFormData({ ...formData, appliedRole: e.target.value })
                }
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                name="experienceYears"
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={(e) =>
                  setFormData({ ...formData, experienceYears: e.target.value })
                }
                placeholder="5"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Candidate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
