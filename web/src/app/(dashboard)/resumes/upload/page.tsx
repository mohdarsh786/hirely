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

import { Suspense } from 'react';

function ResumeUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
    setSuccess('');
    try {
      const result = await api.resumes.upload(candidateId, file);
      setSuccess('Resume uploaded and scored successfully! Redirecting...');
      
      // Redirect to candidate detail page after 1.5 seconds
      setTimeout(() => {
        router.push(`/candidates/${candidateId}`);
      }, 1500);
    } catch (error) {
      console.error('Failed to upload resume:', error);
      setError('Failed to upload resume. Please try again.');
      setUploading(false);
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
              Upload Resume
            </CardTitle>
            <CardDescription>
              Select a PDF or DOC file - scoring happens automatically
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
                disabled={uploading}
              />
              {file && (
                <p className="text-xs text-slate-500">
                  Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-sm text-blue-900">
                ℹ️ Resume will be automatically scored against the job requirements when uploaded
              </p>
            </div>

            <Button onClick={handleUpload} disabled={!file || uploading} className="bg-slate-900 hover:bg-slate-800">
              {uploading ? 'Uploading & Scoring...' : 'Upload Resume'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResumeUploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResumeUploadContent />
    </Suspense>
  );
}
