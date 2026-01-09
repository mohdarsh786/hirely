'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting to Gmail...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Access denied or failed');
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code found');
      return;
    }

    // Exchange code for token
    const state = searchParams.get('state') || undefined;
    
    api.integrations.callback(code, state)
      .then((res) => {
        setStatus('success');
        setMessage('Successfully connected!');
        setTimeout(() => {
            const redirectUrl = res.jobId 
                ? `/batch-upload?jobId=${res.jobId}`
                : '/batch-upload';
            router.push(redirectUrl);
        }, 1500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage('Failed to connect account');
        console.error(err);
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center space-y-4">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900">Connecting...</h1>
            <p className="text-gray-500">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900">Connected!</h1>
            <p className="text-gray-500">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900">Connection Failed</h1>
            <p className="text-gray-500">{message}</p>
            <button 
                onClick={() => router.push('/batch-upload')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
            >
                Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <CallbackContent />
    </Suspense>
  );
}
