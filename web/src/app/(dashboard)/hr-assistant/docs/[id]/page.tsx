'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { api, type HRDocument } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import { ArrowLeft, FileText, Calendar, User, Loader2 } from 'lucide-react';

function DocumentViewContent() {
    const params = useParams();
    const router = useRouter();
    const [document, setDocument] = useState<HRDocument | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocument();
    }, [params.id]);

    const loadDocument = async () => {
        try {
            const data = await api.hrDocs.get(params.id as string);
            setDocument(data.document);
        } catch (error) {
            console.error('Failed to load document:', error);
            // Redirect back if document not found
            router.push('/hr-assistant');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!document) {
        return null;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Link href="/hr-assistant">
                <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to HR Assistant
                </Button>
            </Link>

            <Card>
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{document.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(document.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </CardDescription>
                        </div>
                        <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="prose prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                            {document.content}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DocumentViewPage() {
    return (
        <RouteGuard allowedRoles={['HR_ADMIN', 'RECRUITER', 'EMPLOYEE']}>
            <DocumentViewContent />
        </RouteGuard>
    );
}
