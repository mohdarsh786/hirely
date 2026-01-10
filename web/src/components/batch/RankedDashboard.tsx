'use client';

import { useState, useMemo, Fragment } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Download, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BatchCandidate } from '@/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface RankedDashboardProps {
  candidates: BatchCandidate[];
  jobTitle: string;
}

type SortKey = 'score' | 'name';
type SortOrder = 'asc' | 'desc';

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-sm">—</span>;
  
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-700', getColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 tabular-nums w-8">{score}</span>
    </div>
  );
}

function SkillTag({ skill, variant }: { skill: string; variant: 'matched' | 'missing' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
      variant === 'matched' 
        ? 'bg-green-50 text-green-700' 
        : 'bg-gray-100 text-gray-600'
    )}>
      {skill}
    </span>
  );
}

export function RankedDashboard({ candidates, jobTitle }: RankedDashboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const cmp = sortKey === 'score' 
        ? (a.score ?? -1) - (b.score ?? -1)
        : a.name.localeCompare(b.name);
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [candidates, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const exportCSV = () => {
    const rows = sorted.map((c, i) => [
      i + 1, c.name, c.email || '', c.score ?? '', 
      c.matchedSkills.join('; '), c.missingSkills.join('; ')
    ]);
    const csv = [['Rank', 'Name', 'Email', 'Score', 'Matched', 'Missing'].join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-${jobTitle.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
  };

  const SortIndicator = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortOrder === 'desc' 
      ? <ChevronDown className="w-3.5 h-3.5" />
      : <ChevronUp className="w-3.5 h-3.5" />;
  };

  const [insightCandidateId, setInsightCandidateId] = useState<string | null>(null);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Ranked Candidates</h2>
            <p className="text-sm text-gray-500">{candidates.length} candidates for {jobTitle}</p>
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-12">#</th>
                <th 
                  onClick={() => toggleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700"
                >
                  <span className="inline-flex items-center gap-1">Name <SortIndicator col="name" /></span>
                </th>
                <th 
                  onClick={() => toggleSort('score')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 w-40"
                >
                  <span className="inline-flex items-center gap-1">Score <SortIndicator col="score" /></span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Matched</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Missing</th>
                <th className="px-6 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((c, idx) => (
                <Fragment key={c.id || idx}>
                  <tr 
                    key={c.id}
                    onClick={() => c.id && setExpandedId(expandedId === c.id ? null : c.id)}
                    className={cn(
                      'hover:bg-gray-50 transition-colors cursor-pointer',
                      expandedId === c.id && 'bg-gray-50'
                    )}
                  >
                    <td className="px-6 py-4 text-sm text-gray-400 tabular-nums">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                    </td>
                    <td className="px-6 py-4"><ScoreBar score={c.score} /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.matchedSkills.slice(0, 3).map(s => <SkillTag key={s} skill={s} variant="matched" />)}
                        {c.matchedSkills.length > 3 && <span className="text-xs text-gray-400">+{c.matchedSkills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.missingSkills.slice(0, 3).map(s => <SkillTag key={s} skill={s} variant="missing" />)}
                        {c.missingSkills.length > 3 && <span className="text-xs text-gray-400">+{c.missingSkills.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {c.id && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setInsightCandidateId(c.id);
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-flex items-center gap-1 transition-colors"
                            >
                                <Sparkles className="w-3 h-3" />
                                AI Insights
                            </button>
                        )}
                        {c.id && (
                          <Link
                            href={`/candidates/${c.id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-sm text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                            title="View Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-detail`} className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="pl-8 space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Analysis</p>
                            <p className="text-sm text-gray-700">{c.reason || 'No analysis available.'}</p>
                          </div>
                          <div className="flex gap-6">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase mb-1">All Matched</p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {c.matchedSkills?.map((skill: string) => (
                                  <Badge key={skill} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                    {skill}
                                  </Badge>
                                ))}
                                {c.matchedSkills?.length === 0 && <span className="text-xs text-gray-400">None</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase mb-1">All Missing</p>
                              <div className="flex flex-wrap gap-1">
                                {c.missingSkills.map(s => <SkillTag key={s} skill={s} variant="missing" />)}
                                {c.missingSkills.length === 0 && <span className="text-xs text-gray-400">None</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {candidates.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            No candidates to display.
          </div>
        )}
      </div>

      <CandidateInsightModal 
        isOpen={!!insightCandidateId} 
        candidateId={insightCandidateId || ''} 
        onClose={() => setInsightCandidateId(null)} 
      />
    </>
  );
}
import { Sparkles } from 'lucide-react';
import { CandidateInsightModal } from './CandidateInsightModal';
