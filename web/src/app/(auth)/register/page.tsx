'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { signUp } from '@/lib/supabase';
import { LoginDoodle } from '@/components/doodles/LoginDoodle';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        const errors: typeof validationErrors = {};
        if (!form.email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errors.email = 'Please enter a valid email';
        }
        if (!form.password) {
            errors.password = 'Password is required';
        } else if (form.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (form.password !== form.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const { error: signUpError } = await signUp(form.email, form.password, {
                role: 'EMPLOYEE',
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            setSuccess(true);
        } catch {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-6">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
                    <p className="mt-3 text-slate-600">
                        We&apos;ve sent you a confirmation link to <span className="font-semibold">{form.email}</span>.
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Click the link in your email to activate your account, then you can sign in.
                    </p>
                    <Link href="/login" className="mt-8 block">
                        <Button variant="outline" className="h-11 w-full border-slate-200 hover:bg-slate-50">
                            Back to Sign In
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Form */}
            <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-24">
                <div className="mx-auto w-full max-w-md">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Create an account
                        </h1>
                        <p className="mt-2 text-slate-600">
                            Get started with Hirely HR Platform.
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
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="you@company.com"
                                className="h-11"
                            />
                            {validationErrors.email && (
                                <p className="text-sm text-red-600">{validationErrors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="••••••••"
                                className="h-11"
                            />
                            {validationErrors.password && (
                                <p className="text-sm text-red-600">{validationErrors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                className="h-11"
                            />
                            {validationErrors.confirmPassword && (
                                <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>
                            )}
                        </div>

                        <Button type="submit" className="h-11 w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <p className="mt-8 text-center text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="relative hidden w-1/2 flex-col justify-center bg-slate-50 p-24 lg:flex">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="relative z-10 mx-auto w-full max-w-lg">
                    <LoginDoodle className="h-auto w-full drop-shadow-2xl" />
                    <div className="mt-12 text-center">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Join the Future of Work
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            Start automating your HR workflows today and focus on what matters most - people.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
