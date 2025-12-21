'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signIn } from '@/lib/supabase';
import { LoginDoodle } from '@/components/doodles/LoginDoodle';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'HR Admin', email: 'hr@admin.com', password: 'hr@admin', role: 'HR_ADMIN' },
  { label: 'Recruiter', email: 'recruiter@admin.com', password: 'recruiter@admin', role: 'RECRUITER' },
  { label: 'Employee', email: 'employee@test.com', password: 'employee@test', role: 'EMPLOYEE' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signIn(
        credentials.email,
        credentials.password
      );

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, password: string) => {
    setError('');
    setDemoLoading(email);

    try {
      const { data, error: authError } = await signIn(email, password);

      if (authError) {
        setError(`Demo login failed: ${authError.message}`);
        setDemoLoading(null);
        return;
      }

      if (data.session) {
        router.push('/dashboard');
      }
    } catch {
      setError('Demo login failed');
      setDemoLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-slate-600">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                placeholder="you@company.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            <Button type="submit" className="h-11 w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-8">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs uppercase text-slate-500">
              Demo Access
            </span>
          </div>

          <div className="grid gap-3">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                className="h-12 justify-between border-slate-200 hover:border-blue-200 hover:bg-blue-50"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin(account.email, account.password)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${demoLoading === account.email ? 'animate-spin bg-blue-100' : 'bg-slate-100'}`}>
                    <CheckCircle2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="font-medium text-slate-700">{account.label}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 opacity-70">{account.role}</span>
              </Button>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="relative hidden w-1/2 flex-col justify-center bg-slate-50 p-24 lg:flex">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="relative z-10 mx-auto w-full max-w-lg">
          <LoginDoodle className="h-auto w-full drop-shadow-2xl" />
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              AI-Powered Recruitment
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Steamline your hiring process with automated screening, scheduling, and insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
