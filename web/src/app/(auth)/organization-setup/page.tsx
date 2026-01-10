'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { SettingsDoodle } from '@/components/doodles/SettingsDoodle';

export default function OrganizationSetupPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Organization name is required');
            return;
        }

        if (!user?.id) {
            setError('You must be logged in to create an organization');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.organizations.register({
                name: formData.name,
                domain: formData.domain || undefined,
                userId: user.id,
            });

            await refreshUser();

            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create organization');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="space-y-4">
                    <div className="flex items-center justify-center">
                        <SettingsDoodle className="h-32 w-full max-w-sm opacity-90" />
                    </div>
                    <div className="text-center">
                        <CardTitle className="text-2xl font-bold">Set Up Your Organization</CardTitle>
                        <CardDescription className="mt-2">
                            Create your company profile to start managing candidates and interviews
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Organization Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Acme Corp"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="domain">Company Domain (Optional)</Label>
                            <Input
                                id="domain"
                                type="text"
                                placeholder="acme.com"
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                className="h-11"
                            />
                            <p className="text-xs text-slate-500">
                                Used for email verification and team invitations
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="h-11 w-full bg-slate-900 hover:bg-slate-800"
                            disabled={loading}
                        >
                            {loading ? 'Creating Organization...' : 'Create Organization'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
