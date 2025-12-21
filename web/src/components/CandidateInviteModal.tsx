'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, type CandidateInvite } from '@/lib/api';
import { Mail, Copy, Check } from 'lucide-react';

interface CandidateInviteModalProps {
    candidateId: string;
    candidateEmail: string | null;
    children: React.ReactNode;
}

export function CandidateInviteModal({
    candidateId,
    candidateEmail,
    children,
}: CandidateInviteModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [invite, setInvite] = useState<CandidateInvite | null>(null);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState(candidateEmail || '');

    const handleGenerate = async () => {
        setError('');
        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);

        try {
            const data = await api.invites.createCandidate({
                candidateId,
                email,
                expiresInDays: 7,
            });

            setInvite(data.invite);
            setInviteLink(data.inviteLink);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate invite');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Send Interview Invite
                    </DialogTitle>
                    <DialogDescription>
                        Generate a unique link for the candidate to start their interview
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {!invite ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="email">Candidate Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="candidate@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">
                                    Link expires in 7 days
                                </p>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Generating...' : 'Generate Interview Link'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Interview Link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={inviteLink}
                                        readOnly
                                        className="font-mono text-xs"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={handleCopy}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Share this link with the candidate via email
                                </p>
                            </div>

                            <div className="rounded-lg bg-green-50 p-4">
                                <p className="text-sm text-green-700 font-medium">
                                    ✓ Invite generated successfully!
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    Token: {invite.token.substring(0, 16)}...
                                </p>
                            </div>

                            <Button
                                onClick={() => {
                                    setInvite(null);
                                    setInviteLink('');
                                    setOpen(false);
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Close
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
