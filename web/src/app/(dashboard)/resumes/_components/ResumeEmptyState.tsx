import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ResumeProcessingDoodle } from '@/components/doodles/ResumeProcessingDoodle';

export default function ResumeEmptyState({ hasResumes }: { hasResumes: boolean }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
      <div className="flex flex-col items-center text-center">
        <ResumeProcessingDoodle className="h-56 w-56 opacity-80" />
        <p className="mt-4 mb-4 text-sm text-slate-600">
          {hasResumes ? 'No resumes match the filter' : 'No resumes found'}
        </p>
        <Link href="/candidates"><Button>View Candidates</Button></Link>
      </div>
    </div>
  );
}
