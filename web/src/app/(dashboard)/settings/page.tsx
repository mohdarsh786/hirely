'use client';

import { RouteGuard } from '@/components/RouteGuard';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { SettingsDoodle } from '@/components/doodles/SettingsDoodle';

function SettingsContent() {
    const { user } = useAuth();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-500">
                    Administration and configuration
                </p>
            </div>

            {/* Decorative Banner */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200">
                <div className="flex items-center justify-center py-8">
                    <SettingsDoodle className="h-40 w-full max-w-md opacity-90" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Account</CardTitle>
                        <CardDescription>Your account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Role</p>
                            <Badge variant="secondary">{user?.role}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">System</CardTitle>
                        <CardDescription>Platform configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500">Version</p>
                            <p className="text-sm font-medium text-slate-900">1.0.0-beta</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Environment</p>
                            <Badge variant="outline">Development</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <RouteGuard>
            <SettingsContent />
        </RouteGuard>
    );
}
