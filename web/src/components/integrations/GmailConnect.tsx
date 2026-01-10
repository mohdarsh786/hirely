'use client';

import { useState } from 'react';
import { Mail, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface GmailConnectProps {
  jobId: string;
  onConnected?: () => void;
  className?: string;
}

export function GmailConnect({ jobId, onConnected, className }: GmailConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await api.integrations.getGmailAuthUrl(jobId);
      window.location.href = url;
    } catch (err) {
      setError('Failed to start connection');
      setLoading(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={connect}
        disabled={loading}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
          "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4 text-red-500" />
        )}
        Connect Gmail Account
      </button>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
      <p className="text-xs text-center text-gray-500">
        We'll verify your account securely via Google
      </p>
    </div>
  );
}
