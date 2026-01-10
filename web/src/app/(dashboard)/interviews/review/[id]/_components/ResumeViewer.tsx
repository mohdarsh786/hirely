'use client';

import { X, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ResumeViewerProps {
  resume: any;
  onClose: () => void;
}

export function ResumeViewer({ resume, onClose }: ResumeViewerProps) {
  const handleDownload = () => {
    if (resume.fileUrl) {
      window.open(resume.fileUrl, '_blank');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Resume Preview</span>
            <div className="flex gap-2">
              {resume.fileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {resume.fileUrl ? (
            <iframe
              src={resume.fileUrl}
              className="w-full h-full border rounded"
              title="Resume Preview"
            />
          ) : (
            <div className="p-6 space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Extracted Text:</h3>
                <pre className="whitespace-pre-wrap text-sm">
                  {resume.extractedText || 'No text extracted from resume'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
