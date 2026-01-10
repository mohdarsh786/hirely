'use client';

import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api, type OrganizationMember } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { RouteGuard } from '@/components/RouteGuard';
import { TeamDoodle } from '@/components/doodles/TeamDoodle';
import { Mail, Users, Shield } from 'lucide-react';

function OrganizationSettingsContent() {
    const { user } = useAuth();
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'RECRUITER',
    });

    const organizationId = user?.organizationId;

    useEffect(() => {
        if (organizationId) {
            loadMembers();
        }
    }, [organizationId]);

    const loadMembers = async () => {
        if (!organizationId) return;
        try {
            const data = await api.organizations.getMembers(organizationId);
            setMembers(data.members);
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!inviteForm.email || !inviteForm.role) {
            setError('Email and role are required');
            return;
        }

        if (!organizationId) {
            setError('Organization ID missing');
            return;
        }

        setInviteLoading(true);

        try {
            await api.organizations.inviteMember(organizationId, inviteForm);
            setSuccess(`Invitation sent to ${inviteForm.email}`);
            setInviteForm({ email: '', role: 'RECRUITER' });
            // Refresh members list
            await loadMembers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invitation');
        } finally {
            setInviteLoading(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'HR_ADMIN':
                return 'bg-purple-100 text-purple-700';
            case 'RECRUITER':
                return 'bg-blue-100 text-blue-700';
            case 'EMPLOYEE':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const isAmin = user?.role === 'HR_ADMIN';

    return (
        <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
            {/* Decorative Header Banner */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-slate-50 border border-slate-200">
                <div className="flex items-center justify-between p-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
                        <p className="text-slate-500">Manage your team members and permissions</p>
                    </div>
                    <TeamDoodle className="h-32 w-40 opacity-90" />
                </div>
            </div>

            <div className={`grid gap-6 ${isAmin ? 'lg:grid-cols-2' : ''}`}>
                {/* Invite Member Form - Only for Admins */}
                {isAmin && (
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-blue-50/50">
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Invite Team Member
                            </CardTitle>
                            <CardDescription>
                                Send an email invitation to add someone to your organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleInvite} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                                        {success}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="colleague@company.com"
                                        value={inviteForm.email}
                                        onChange={(e) =>
                                            setInviteForm({ ...inviteForm, email: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        value={inviteForm.role}
                                        onValueChange={(value) =>
                                            setInviteForm({ ...inviteForm, role: value })
                                        }
                                    >
                                        <SelectTrigger id="role">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HR_ADMIN">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    HR Admin
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="RECRUITER">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Recruiter
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500">
                                        Admins can manage settings, Recruiters can manage candidates
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800"
                                    disabled={inviteLoading}
                                >
                                    {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Team Members List */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Members
                        </CardTitle>
                        <CardDescription>
                            {members.length} {members.length === 1 ? 'member' : 'members'} in your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-sm text-slate-500">Loading members...</p>
                        ) : members.length === 0 ? (
                            <p className="text-sm text-slate-500">No members yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold">
                                                {member.userId.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    User {member.userId.substring(0, 8)}...
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Joined {new Date(member.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={getRoleBadgeColor(member.role)}>
                                            {member.role.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function OrganizationSettingsPage() {
    return (
        <RouteGuard allowedRoles={['HR_ADMIN']}>
            <OrganizationSettingsContent />
        </RouteGuard>
    );
}
