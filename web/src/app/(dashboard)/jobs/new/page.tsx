'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    experienceYears: '',
    status: 'active' as 'draft' | 'active' | 'closed',
  });
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (skills.length === 0) {
      alert('Please add at least one required skill');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: formData.title,
        description: formData.description || undefined,
        requiredSkills: skills,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
        status: formData.status,
      };

      await api.jobs.create(data);
      router.push('/jobs');
    } catch (error: any) {
      console.error('Failed to create job:', error);
      
      // Check if organization setup is needed (case-insensitive check)
      const errorMsg = error.message || '';
      if (errorMsg.toLowerCase().includes('organization')) {
        setError('You need to complete organization setup first.');
        setTimeout(() => {
          router.push('/organization-setup');
        }, 2000);
      } else {
        setError(errorMsg || 'Failed to create job');
      }
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create New Job</h1>
        <p className="text-slate-600 mt-1">Define a new job position with requirements</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 max-w-2xl">
          <p className="text-red-800 font-medium">⚠️ {error}</p>
          {error.toLowerCase().includes('organization') && (
            <p className="text-sm text-red-600 mt-1">
              Redirecting to organization setup...
            </p>
          )}
        </div>
      )}

      <Card className="max-w-2xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Enter the job information and required skills</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Full Stack Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the role and responsibilities..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills *</Label>
              <div className="flex gap-2">
                <Input
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                />
                <Button type="button" onClick={addSkill}>Add</Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500">Add skills one by one. Press Enter or click Add.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience Required (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || skills.length === 0}>
                {loading ? 'Creating...' : 'Create Job'}
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
