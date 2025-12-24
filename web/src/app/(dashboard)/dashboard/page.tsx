'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type Candidate } from '@/lib/api';
import {
  Users,
  Video,
  FileText,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Plus,
  Briefcase,
  Search,
} from 'lucide-react';

// Lazy load doodles to improve initial load time
const WelcomeDoodle = dynamic(
  () => import('@/components/doodles/WelcomeDoodle').then(mod => ({ default: mod.WelcomeDoodle })),
  { ssr: false, loading: () => <div className="h-32 w-32" /> }
);

const EmptyStateDoodle = dynamic(
  () => import('@/components/doodles/EmptyStateDoodle').then(mod => ({ default: mod.EmptyStateDoodle })),
  { ssr: false, loading: () => <div className="h-32 w-32" /> }
);

interface DashboardStats {
  totalCandidates: number;
  totalInterviews: number;
  totalResumes: number;
  averageInterviewScore: number;
  pendingInterviews: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
}) {
  return (
    <Card className="overflow-hidden border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium text-slate-500">{title}</CardDescription>
        <div className="rounded-full bg-slate-50 p-2">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-slate-500">
            {description} {trend && <span className="ml-1 text-green-600 font-medium">{trend}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RecruiterDashboard({
  stats,
  recentCandidates,
}: {
  stats: DashboardStats | null;
  recentCandidates: Candidate[];
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500">Track your recruitment pipeline performance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/candidates/new">
            <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4" /> New Candidate
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Candidates"
          value={stats?.totalCandidates ?? 0}
          icon={Users}
          description="Active pipeline"
          trend="+12%"
        />
        <StatCard
          title="Scheduled Interviews"
          value={stats?.totalInterviews ?? 0}
          icon={Video}
          description={`${stats?.pendingInterviews ?? 0} upcoming`}
        />
        <StatCard
          title="Resumes Processed"
          value={stats?.totalResumes ?? 0}
          icon={FileText}
          description="AI parsed & scored"
        />
        <StatCard
          title="Avg. Qualification"
          value={`${stats?.averageInterviewScore ?? 0}%`}
          icon={TrendingUp}
          description="Candidate quality score"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Candidates (Main Content) */}
        <Card className="border-slate-100 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Recent Candidates</CardTitle>
              <CardDescription>Latest applicants across all roles</CardDescription>
            </div>
            <Link href="/candidates">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <EmptyStateDoodle className="h-40 w-40 opacity-80" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">No candidates yet</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  Get started by adding a new candidate to your pipeline.
                </p>
                <Link href="/candidates/new" className="mt-4">
                  <Button variant="outline">Add Candidate</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCandidates.slice(0, 5).map((candidate) => (
                  <Link
                    key={candidate.id}
                    href={`/candidates/${candidate.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-4 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{candidate.name}</p>
                        <p className="text-xs text-slate-500">
                          {candidate.appliedRole || 'General Application'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {candidate.experienceYears !== null && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                          {candidate.experienceYears}y exp
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions (Sidebar) */}
        <div className="space-y-6">
          <Card className="border-slate-100 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Fast track your tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link href="/interviews" className="block">
                <Button variant="outline" className="w-full justify-between h-12 hover:bg-slate-50 border-slate-200">
                  <span className="flex items-center gap-2 text-slate-700"><Video className="h-4 w-4" /> Interviews</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Button>
              </Link>
              <Link href="/hr-assistant" className="block">
                <Button variant="outline" className="w-full justify-between h-12 hover:bg-slate-50 border-slate-200">
                  <span className="flex items-center gap-2 text-slate-700"><MessageSquare className="h-4 w-4" /> HR Chat</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-orange-500" />
                  <div>
                    <p className="font-medium text-slate-700">Review 3 new resumes</p>
                    <p className="text-xs text-slate-400">Due Today</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium text-slate-700">Finalize job offer layout</p>
                    <p className="text-xs text-slate-400">Tomorrow</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-8 flex flex-col justify-center">
            <Badge className="w-fit mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Employee Portal</Badge>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'Team Member'}!
            </h1>
            <p className="text-slate-600 mb-6 text-lg">
              Your HR assistant is ready to help you with policies, leave requests, and benefits.
            </p>
            <div className="flex gap-3">
              <Link href="/hr-assistant">
                <Button className="bg-slate-900 hover:bg-slate-800 h-10 px-6">
                  Ask HR Assistant
                </Button>
              </Link>
              <Button variant="outline">View Profile</Button>
            </div>
          </div>
          <div className="bg-blue-50/50 md:w-1/3 flex items-end justify-center pt-8 pr-8">
            <WelcomeDoodle className="h-48 w-full drop-shadow-lg" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Questions */}
        <Card className="md:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" />
              Common Questions
            </CardTitle>
            <CardDescription>Quick answers for common HR inquiries</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🏖️', text: 'How do I request time off?' },
              { icon: '🏥', text: 'What are my health benefits?' },
              { icon: '📅', text: 'Company holiday schedule' },
              { icon: '💻', text: 'Remote work policy' },
              { icon: '💰', text: 'Expense reimbursement' },
              { icon: '🎓', text: 'Learning & Development budget' },
            ].map((item) => (
              <Link
                key={item.text}
                href={`/hr-assistant?q=${encodeURIComponent(item.text)}`}
                className="group flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50 transition-all"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{item.text}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Your Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">Employee Handbook</p>
                <p className="text-xs text-slate-500">Updated Dec 2024</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">Benefits Guide</p>
                <p className="text-xs text-slate-500">2025 Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const isRecruiter = hasRole(['HR_ADMIN', 'RECRUITER']);

  useEffect(() => {
    if (isRecruiter) {
      api.stats
        .dashboard()
        .then((data) => {
          setStats(data.stats);
          setRecentCandidates(data.recentCandidates);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isRecruiter]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-sm font-medium text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50/50 min-h-screen">
      {isRecruiter ? (
        <RecruiterDashboard stats={stats} recentCandidates={recentCandidates} />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
