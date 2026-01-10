'use client';

import { useState } from 'react';
import { Mail, HardDrive, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface GoogleConnectProps {
  jobId: string;
  provider: 'gmail' | 'drive';
}

export function GoogleConnect({ jobId, provider }: GoogleConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = provider === 'gmail' 
        ? await api.integrations.getGmailAuthUrl(jobId)
        : await api.integrations.getDriveAuthUrl(jobId);
      
      window.location.href = url;
    } catch (err) {
      setError('Failed to start connection');
      setLoading(false);
    }
  };

  const isGmail = provider === 'gmail';
  const Icon = isGmail ? Mail : HardDrive;
  const label = isGmail ? 'Connect Gmail' : 'Connect Drive';
  const colorClass = isGmail ? 'text-red-500' : 'text-green-500';

  return (
    <div className="space-y-2 w-full max-w-xs">
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
          <Icon className={cn("w-4 h-4", colorClass)} />
        )}
        {label}
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
