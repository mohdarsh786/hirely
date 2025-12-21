import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900">403</h1>
        <p className="mt-4 text-xl text-slate-600">Access Denied</p>
        <p className="mt-2 text-sm text-slate-500">
          You don't have permission to access this resource.
        </p>
        <div className="mt-6">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
