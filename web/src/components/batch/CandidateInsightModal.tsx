'use client';

import { useEffect, useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, Sparkles, BrainCircuit, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface CandidateInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
}

interface InsightsData {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  insights: {
    why_matched: string;
    suggested_interview_questions: string[];
    strengths: string[];
    weaknesses: string[];
  };
}

export function CandidateInsightModal({ isOpen, onClose, candidateId }: CandidateInsightModalProps) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && candidateId) {
      setLoading(true);
      setError(null);
      api.candidates.getInsights(candidateId)
        .then(res => setData(res))
        .catch(err => {
            console.error('Failed to fetch insights:', err);
            setError('Failed to generate insights. Please try again.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, candidateId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Candidate Insights
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                    <p>Analyzing candidate profile...</p>
                </div>
            ) : error ? (
                <div className="py-8 text-center text-red-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>{error}</p>
                </div>
            ) : data ? (
                <div className="space-y-6">
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-900 mb-2">
                            <BrainCircuit className="w-4 h-4" />
                            Why this candidate?
                        </h4>
                        <p className="text-sm text-indigo-800 leading-relaxed">
                            {data.insights.why_matched}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
                                <CheckCircle2 className="w-4 h-4" />
                                Key Strengths
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(data.insights.strengths || []).map(skill => (
                                    <Badge key={skill} className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                        {skill}
                                    </Badge>
                                ))}
                                {(!data.insights.strengths || data.insights.strengths.length === 0) && <span className="text-sm text-gray-500">None identified</span>}
                            </div>
                        </div>
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-orange-700 mb-3">
                                <AlertCircle className="w-4 h-4" />
                                Missing Requirements
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(data.insights.weaknesses || []).map(skill => (
                                    <Badge key={skill} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                                        {skill}
                                    </Badge>
                                ))}
                                {(!data.insights.weaknesses || data.insights.weaknesses.length === 0) && <span className="text-sm text-gray-500">None identified</span>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                            <HelpCircle className="w-4 h-4 text-purple-500" />
                            Suggested Interview Questions
                        </h4>
                        <ul className="space-y-2">
                            {(data.insights.suggested_interview_questions || []).map((q, i) => (
                                <li key={i} className="text-sm text-gray-600 pl-4 border-l-2 border-purple-200 bg-gray-50 py-2 pr-2 rounded-r">
                                    {q}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
