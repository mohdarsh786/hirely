'use client';

import { useState, useEffect, Suspense } from 'react';
import { api } from '@/lib/api';
import { DropZone } from '@/components/batch/DropZone';
import { RankedDashboard } from '@/components/batch/RankedDashboard';
import { IntegrationSelector, type IntegrationType } from '@/components/integrations/IntegrationSelector';
import { GmailConnect } from '@/components/integrations/GmailConnect';
import { DriveConnect } from '@/components/integrations/DriveConnect';
import { Loader2, Plus, Check, AlertCircle, ChevronRight, Clock, FileText, RefreshCw, CheckCircle2, Mail, HardDrive, FolderOpen, Search, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Job, BatchCandidate, BatchUpload } from '@/types';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type State = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface Progress {
  processed: number;
  total: number;
  candidates: BatchCandidate[];
}

function BatchUploadContent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<BatchUpload[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [integrationType, setIntegrationType] = useState<IntegrationType>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQuickJob, setShowQuickJob] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSkills, setQuickSkills] = useState('');
  const [creating, setCreating] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<{
    gmail: { id: string; email: string; metadata: any; updatedAt: string } | null;
    drive: { id: string; email: string; metadata: any; updatedAt: string } | null;
  }>({ gmail: null, drive: null });
  const [driveFolders, setDriveFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [gmailSearchQuery, setGmailSearchQuery] = useState('resume OR cv OR application');

  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const jobsRes = await api.jobs.list();
      setJobs(jobsRes.jobs.filter(j => j.status === 'active'));
      
      // Auto-select job from URL if present
      const jobIdParam = searchParams.get('jobId');
      if (jobIdParam) {
        setSelectedJobId(jobIdParam);
      }

    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
    
    // Load history separately, don't block UI
    try {
      const historyRes = await api.batch.getHistory();
      setHistory(historyRes.batches || []);
    } catch {
      // History table might not exist yet, ignore
    }

    // Load integration status
    try {
      const statusRes = await api.integrations.getStatus();
      setIntegrationStatus(statusRes);
      
      // If Drive is connected, load folders
      if (statusRes.drive) {
        try {
          const foldersRes = await api.integrations.getDriveFolders();
          setDriveFolders(foldersRes.folders);
        } catch {
          // Ignore folder loading errors
        }
      }
    } catch {
      // Ignore if not available
    }
  };

  const disconnectIntegration = async (provider: 'gmail' | 'drive') => {
    try {
      await api.integrations.disconnect(provider);
      setIntegrationStatus(prev => ({ ...prev, [provider]: null }));
      if (provider === 'drive') {
        setDriveFolders([]);
        setSelectedFolderId('');
      }
    } catch (err) {
      setError(`Failed to disconnect ${provider}`);
    }
  };

  const createQuickJob = async () => {
    if (!quickTitle.trim() || !quickSkills.trim()) return;
    setCreating(true);
    try {
      const skills = quickSkills.split(',').map(s => s.trim()).filter(Boolean);
      const { job } = await api.batch.quickCreateJob({ title: quickTitle.trim(), requiredSkills: skills });
      setJobs(prev => [job, ...prev]);
      setSelectedJobId(job.id);
      setShowQuickJob(false);
      setQuickTitle('');
      setQuickSkills('');
    } catch (err) {
      setError('Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const startProcessing = async () => {
    if (!selectedJobId) return;
    
    if (integrationType === 'upload' && files.length === 0) return;
    
    setState('uploading');
    setError(null);
    setProgress(null);

    try {
      let batchId: string;
      let totalFiles: number;

      if (integrationType === 'upload') {
        const res = await api.batch.upload(selectedJobId, files);
        batchId = res.batchId;
        totalFiles = res.totalFiles;
      } else if (integrationType === 'gmail') {
        const res = await api.integrations.syncGmail(selectedJobId, gmailSearchQuery);
        batchId = res.batchId;
        totalFiles = res.count;
        if (totalFiles === 0) {
            setError(res.message || 'No emails with PDF attachments found matching your query.');
            setState('idle');
            return;
        }
      } else if (integrationType === 'drive') {
        const res = await api.integrations.syncDrive(selectedJobId, selectedFolderId || undefined);
        batchId = res.batchId;
        totalFiles = res.count;
        if (totalFiles === 0) {
            setError(res.message || 'No PDF files found in the selected folder.');
            setState('idle');
            return;
        }
      } else {
        return;
      }

      setState('processing');
      setProgress({ processed: 0, total: totalFiles, candidates: [] });

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(api.batch.getStatusUrl(batchId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to connect');
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'progress') {
                setProgress({ processed: data.processed, total: data.total, candidates: data.candidates || [] });
              } else if (data.type === 'complete') {
                setProgress({ processed: data.candidates.length, total: data.candidates.length, candidates: data.candidates || [] });
                setState('completed');
                return;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setState('error');
    }
  };

  const reset = () => {
    setState('idle');
    setProgress(null);
    setError(null);
    setFiles([]);
    loadData();
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  if (state === 'completed' && progress?.candidates) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Analysis Complete</h1>
              <p className="text-sm text-gray-500">{progress.candidates.length} resumes processed for {selectedJob?.title}</p>
            </div>
          </div>
          <button onClick={reset} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            New Batch
          </button>
        </div>
        <RankedDashboard candidates={progress.candidates} jobTitle={selectedJob?.title || ''} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Resume Analysis</h1>
        <p className="text-gray-500 mt-1">Upload or sync resumes to analyze and rank candidates</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Position</label>
          {loadingJobs ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                disabled={state !== 'idle'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a job...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title} ({job.requiredSkills.length} skills)</option>
                ))}
              </select>
              
              {!showQuickJob ? (
                <button
                  onClick={() => setShowQuickJob(true)}
                  disabled={state !== 'idle'}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Create new job
                </button>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <input
                    type="text"
                    placeholder="Job title"
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Required skills (comma-separated)"
                    value={quickSkills}
                    onChange={e => setQuickSkills(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={createQuickJob}
                      disabled={creating || !quickTitle.trim() || !quickSkills.trim()}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    <button onClick={() => setShowQuickJob(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedJob && (
          <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
            Matching against: {selectedJob.requiredSkills.join(', ')}
          </div>
        )}

        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Collection Method</label>
            <IntegrationSelector value={integrationType} onChange={setIntegrationType} />
        </div>

        {integrationType === 'upload' ? (
             <DropZone onFilesSelected={setFiles} disabled={state !== 'idle'} />
        ) : (
             selectedJobId && (
                 <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                     {integrationType === 'gmail' ? (
                        integrationStatus.gmail ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Gmail Connected</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{integrationStatus.gmail.email}</span>
                                <button
                                  onClick={() => disconnectIntegration('gmail')}
                                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                >
                                  <Unlink className="w-3 h-3" /> Disconnect
                                </button>
                              </div>
                            </div>
                            
                            {/* Gmail Search Query Input */}
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Search className="w-4 h-4" />
                                Search Query
                              </label>
                              <input
                                type="text"
                                value={gmailSearchQuery}
                                onChange={(e) => setGmailSearchQuery(e.target.value)}
                                placeholder="e.g., resume, cv, application, from:careers@company.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <p className="text-xs text-gray-500">
                                Use Gmail search syntax: "resume", "from:email@example.com", "subject:application"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <GmailConnect jobId={selectedJobId} />
                        )
                     ) : (
                        integrationStatus.drive ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Google Drive Connected</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{integrationStatus.drive.email}</span>
                                <button
                                  onClick={() => disconnectIntegration('drive')}
                                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                >
                                  <Unlink className="w-3 h-3" /> Disconnect
                                </button>
                              </div>
                            </div>
                            
                            {/* Drive Folder Selection */}
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FolderOpen className="w-4 h-4" />
                                Select Folder
                              </label>
                              <select
                                value={selectedFolderId}
                                onChange={(e) => setSelectedFolderId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="">All folders (scan entire Drive)</option>
                                {driveFolders.map((folder) => (
                                  <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500">
                                Select a specific folder containing resumes, or scan all PDF files in your Drive.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <DriveConnect jobId={selectedJobId} />
                        )
                     )}
                 </div>
             )
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {state === 'processing' && progress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Analyzing resume {progress.processed + 1} of {progress.total}</span>
              <span className="font-medium text-gray-900">{Math.round((progress.processed / progress.total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${(progress.processed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={startProcessing}
          disabled={
            !selectedJobId || 
            (integrationType === 'upload' && files.length === 0) || 
            (integrationType === 'gmail' && !integrationStatus.gmail) ||
            (integrationType === 'drive' && !integrationStatus.drive) ||
            state !== 'idle'
          }
          className={cn(
            'w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
            'bg-gray-900 text-white hover:bg-gray-800',
            'disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed'
          )}
        >
          {state === 'uploading' ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
          ) : (
             integrationType === 'upload' 
                ? `Analyze ${files.length} Resume${files.length !== 1 ? 's' : ''}`
                : integrationType === 'gmail'
                  ? (integrationStatus.gmail ? `Sync & Analyze from Gmail` : 'Connect Gmail First')
                  : (integrationStatus.drive ? `Sync & Analyze from Drive` : 'Connect Drive First')
          )}
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700">Recent Batches</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {history.slice(0, 5).map(batch => (
              <Link 
                key={batch.id} 
                href={`/batch-upload/${batch.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{batch.job?.title || 'Unknown Job'}</p>
                    <p className="text-xs text-gray-500">{batch.totalFiles} resumes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(batch.createdAt).toLocaleDateString()}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BatchUploadPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
            <BatchUploadContent />
        </Suspense>
    );
}
