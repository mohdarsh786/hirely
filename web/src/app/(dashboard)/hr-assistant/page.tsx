'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { HRChatDoodle } from '@/components/doodles/HRChatDoodle';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: string; title: string }[];
}

export default function HRAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await api.hrChat.query(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to query HR assistant:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">HR Assistant</h1>
        <Link href="/hr-assistant/docs">
          <Button variant="outline" size="sm">Manage Knowledge Base</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader className="border-b">
              <CardTitle className="text-base">Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <HRChatDoodle className="h-56 w-56 opacity-90" />
                    <p className="mt-6 text-base font-medium text-slate-700">
                      Welcome to HR Assistant
                    </p>
                    <p className="mt-2 text-sm text-slate-500 max-w-md text-center">
                      Ask questions about leave policies, benefits, procedures, and more
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        data-testid="chat-message"
                        className={
                          msg.role === 'user'
                            ? 'flex justify-end'
                            : 'flex justify-start'
                        }
                      >
                        <div
                          className={
                            msg.role === 'user'
                              ? 'max-w-md rounded-lg bg-slate-900 px-3 py-2 text-sm text-white'
                              : 'max-w-2xl space-y-2'
                          }
                        >
                          {msg.role === 'user' ? (
                            <p>{msg.content}</p>
                          ) : (
                            <>
                              <p className="text-sm text-slate-900" data-testid="chat-answer">{msg.content}</p>
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs font-medium text-slate-500">Sources:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {msg.sources.map((source) => (
                                      <a
                                        key={source.id}
                                        href={`/hr-docs/${source.id}`}
                                        data-testid="source-link"
                                        className="inline-flex items-center rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                                      >
                                        {source.title}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-sm text-slate-400">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-slate-100 p-4">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Textarea
                    name="question"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about leave policies, benefits, procedures..."
                    className="min-h-[60px] resize-none"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button type="submit" disabled={loading || !input.trim()}>
                    {loading ? 'Thinking...' : 'Ask'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              'Leave policy',
              'Request time off',
              'Benefits overview',
              'Performance reviews',
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                disabled={loading}
              >
                {question}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
