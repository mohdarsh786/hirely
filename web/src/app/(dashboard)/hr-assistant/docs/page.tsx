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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { api, type HRDocument } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import { DocumentLibraryDoodle } from '@/components/doodles/DocumentLibraryDoodle';
import { Upload, FileText, ArrowLeft, Loader2 } from 'lucide-react';

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
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50/50 min-h-screen">
            <div className="mb-8">
                <Link href="/hr-assistant">
                    <Button variant="ghost" size="sm" className="mb-4 text-slate-500">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assistant
                    </Button>
                </Link>
                
                {/* Decorative Header Banner */}
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between p-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Knowledge Base Management
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Upload documents to train the HR Assistant.
                            </p>
                        </div>
                        <DocumentLibraryDoodle className="h-32 w-40 opacity-90" />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Upload Form */}
                <Card className="lg:col-span-1 h-fit shadow-sm border-slate-200">
                    <CardHeader className="bg-green-50/50">
                        <CardTitle className="text-base">Upload Document</CardTitle>
                        <CardDescription>
                            Add PDF or Text files to the knowledge base.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Document Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Employee Handbook 2024"
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
                                className="w-full bg-slate-900 hover:bg-slate-800"
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
                                        Upload Document
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Documents List */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="text-base">Existing Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <FileText className="h-10 w-10 text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="text-right">Size</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    {doc.title}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-slate-500">
                                                {/* Mock size since API might not return it, or use generic */}
                                                -
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
