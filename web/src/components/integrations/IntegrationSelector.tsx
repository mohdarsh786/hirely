'use client';

import { Upload, Mail, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IntegrationType = 'upload' | 'gmail' | 'drive';

interface IntegrationSelectorProps {
  value: IntegrationType;
  onChange: (value: IntegrationType) => void;
}

export function IntegrationSelector({ value, onChange }: IntegrationSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        onClick={() => onChange('upload')}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
          value === 'upload' 
            ? "border-blue-600 bg-blue-50 text-blue-700" 
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <Upload className={cn("w-6 h-6 mb-2", value === 'upload' ? "text-blue-600" : "text-gray-400")} />
        <span className="text-sm font-medium">Upload PDF</span>
      </button>

      <button
        onClick={() => onChange('gmail')}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
          value === 'gmail' 
            ? "border-red-500 bg-red-50 text-red-700" 
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <Mail className={cn("w-6 h-6 mb-2", value === 'gmail' ? "text-red-500" : "text-gray-400")} />
        <span className="text-sm font-medium">Gmail</span>
      </button>

      <button
        onClick={() => onChange('drive')}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
          value === 'drive' 
            ? "border-green-500 bg-green-50 text-green-700" 
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <HardDrive className={cn("w-6 h-6 mb-2", value === 'drive' ? "text-green-500" : "text-gray-400")} />
        <span className="text-sm font-medium">Google Drive</span>
      </button>
    </div>
  );
}
