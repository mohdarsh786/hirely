'use client';

import { useCallback, useState } from 'react';
import { FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function DropZone({ onFilesSelected, disabled = false, maxFiles = 20 }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((fileList: File[]): { valid: File[]; error: string | null } => {
    for (const f of fileList) {
      if (!f.name.toLowerCase().endsWith('.pdf')) {
        return { valid: [], error: `${f.name} is not a PDF file` };
      }
    }
    if (fileList.length > maxFiles) {
      return { valid: [], error: `Maximum ${maxFiles} files allowed` };
    }
    return { valid: fileList, error: null };
  }, [maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const { valid, error } = validate(Array.from(e.dataTransfer.files));
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setFiles(valid);
    onFilesSelected(valid);
  }, [disabled, validate, onFilesSelected]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    
    const { valid, error } = validate(Array.from(e.target.files));
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setFiles(valid);
    onFilesSelected(valid);
  }, [disabled, validate, onFilesSelected]);

  const remove = useCallback((idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onFilesSelected(next);
  }, [files, onFilesSelected]);

  const clear = useCallback(() => {
    setFiles([]);
    setError(null);
    onFilesSelected([]);
  }, [onFilesSelected]);

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all duration-200',
          'flex flex-col items-center justify-center py-10 px-6',
          isDragging && !disabled ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
          isDragging ? 'bg-blue-100' : 'bg-gray-100'
        )}>
          <FileText className={cn('w-5 h-5', isDragging ? 'text-blue-600' : 'text-gray-400')} />
        </div>
        
        <p className="text-sm text-gray-600 text-center">
          Drop PDF resumes here or <span className="text-blue-600">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Up to {maxFiles} files</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{files.length} file{files.length !== 1 ? 's' : ''}</span>
            <button onClick={clear} className="text-gray-400 hover:text-gray-600">Clear</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-600 group">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
