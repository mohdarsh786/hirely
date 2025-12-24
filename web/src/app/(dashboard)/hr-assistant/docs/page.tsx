'use client';

import { useState, useEffect } from 'react';
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
import { api, type HRDocument } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import { Upload, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load the doodle component
const DocumentLibraryDoodle = dynamic(
    () => import('@/components/doodles/DocumentLibraryDoodle').then(mod => mod.DocumentLibraryDoodle),
    { ssr: false, loading: () => <div className="h-24 w-32" /> }
);

function HRDocsPageContent() {
    const [documents, setDocuments] = useState<HRDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newDoc, setNewDoc] = useState({ title: '', file: null as File | null });

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const data = await api.hrDocs.list();
            setDocuments(data.documents);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewDoc({ ...newDoc, file: e.target.files[0] });
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.file || !newDoc.title) return;

        setUploading(true);
        try {
            await api.hrDocs.upload(newDoc.file, newDoc.title);
            setNewDoc({ title: '', file: null });
            // Reset file input
            const fileInput = document.getElementById('file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            await loadDocuments();
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen">
            <div className="mb-6">
                <Link href="/hr-assistant">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </Link>
                
                <div className="rounded-lg bg-gradient-to-br from-amber-50 to-slate-50 border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Knowledge Base
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Upload documents to train the HR Assistant
                            </p>
                        </div>
                        <DocumentLibraryDoodle className="h-24 w-32" />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-base">Upload Document</CardTitle>
                        <CardDescription>
                            Add PDF or Text files
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Employee Handbook 2024"
                                    value={newDoc.title}
                                    onChange={(e) =>
                                        setNewDoc({ ...newDoc, title: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">File</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".pdf,.txt,.md"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={uploading || !newDoc.file || !newDoc.title}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <FileText className="h-10 w-10 text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500">No documents yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <p className="font-medium">{doc.title}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
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

export default function HRDocsPage() {
    return (
        <RouteGuard allowedRoles={['HR_ADMIN']}>
            <HRDocsPageContent />
        </RouteGuard>
    )
} 