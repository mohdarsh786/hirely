'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state') || undefined;

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

    // Parse state to show correct provider
    let provider = 'Gmail';
    try {
      const stateObj = JSON.parse(state || '{}');
      provider = stateObj.provider === 'drive' ? 'Google Drive' : 'Gmail';
    } catch {}
    setMessage(`Connecting to ${provider}...`);

    // Wait for session and then call API
    const processCallback = async () => {
      // Wait for Supabase session with retries
      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise(r => setTimeout(r, 500)); // Wait 500ms between retries
      }

      if (!session) {
        setStatus('error');
        setMessage('Session expired. Please log in again.');
        return;
      }

      // Call API to exchange code with timeout
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 15000)
        );
        const res = await Promise.race([
          api.integrations.callback(code, state),
          timeoutPromise
        ]) as { jobId?: string };
        
        setStatus('success');
        setMessage('Successfully connected!');
        setTimeout(() => {
          const redirectUrl = res.jobId 
            ? `/batch-upload?jobId=${res.jobId}`
            : '/batch-upload';
          router.push(redirectUrl);
        }, 1500);
      } catch (err: any) {
        console.error('[OAuth Callback] Error:', err);
        setStatus('error');
        setMessage(err.message || 'Connection timed out. Try reconnecting.');
        // Auto-redirect after 3 seconds
        setTimeout(() => router.push('/batch-upload'), 3000);
      }
    };

    processCallback();
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

