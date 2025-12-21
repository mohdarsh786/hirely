'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { UploadResumeDoodle } from '@/components/doodles/UploadResumeDoodle';

export default function ResumeUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<any>(null);
  const [skills, setSkills] = useState<string>('');
  const [jobRole, setJobRole] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError('');
    setSuccess('');
    
    if (selectedFile) {
      // Check file type
      if (!selectedFile.name.match(/\.(pdf|doc|docx)$/i)) {
        setError('Only PDF, DOC, and DOCX files are allowed');
        return;
      }
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setError('File size exceeds 10MB limit');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !candidateId) return;

    setUploading(true);
    setError('');
    try {
      const result = await api.resumes.upload(candidateId, file);
      setUploadedResume(result.resume);
      setSuccess('Resume uploaded successfully');
    } catch (error) {
      console.error('Failed to upload resume:', error);
      setError('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!candidateId || !skills.trim()) return;

    setProcessing(true);
    try {
      const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await api.resumes.process(candidateId, {
        jobRole: jobRole || undefined,
        requiredSkills: skillList,
      });

      router.push(`/candidates/${candidateId}`);
    } catch (error) {
      console.error('Failed to process resume:', error);
      setProcessing(false);
    }
  };

  if (!candidateId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">No candidate selected</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      {/* Decorative Header Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-slate-50 border border-slate-200">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Upload Resume</h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload and process candidate resume with AI
            </p>
          </div>
          <UploadResumeDoodle className="h-32 w-32 opacity-90" />
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">{success}</p>
          </div>
        )}

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-base font-semibold">
              Step 1: Upload File
            </CardTitle>
            <CardDescription>
              Select a PDF or DOC file to upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume">Resume File</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading || uploadedResume}
              />
              {file && (
                <p className="text-xs text-slate-500">
                  Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {uploadedResume ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">Uploaded</Badge>
                <p className="text-sm text-slate-600">Resume saved successfully</p>
              </div>
            ) : (
              <Button onClick={handleUpload} disabled={!file || uploading} className="bg-slate-900 hover:bg-slate-800">
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
            )}
          </CardContent>
        </Card>

        {uploadedResume && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="text-base font-semibold">
                Step 2: Process with AI
              </CardTitle>
              <CardDescription>
                Analyze resume against job requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobRole">Job Role (optional)</Label>
                <Input
                  id="jobRole"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">
                  Required Skills <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="skills"
                  name="requiredSkills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js, PostgreSQL"
                />
                <p className="text-xs text-slate-500">
                  Comma-separated list of skills to match
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleProcess}
                  disabled={!skills.trim() || processing}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  {processing ? 'Scoring...' : 'Score Resume'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/candidates/${candidateId}`)}
                  className="border-slate-300"
                >
                  Skip Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
