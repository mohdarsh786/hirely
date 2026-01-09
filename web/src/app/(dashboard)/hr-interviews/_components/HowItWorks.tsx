import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, Users2, Briefcase, FileText } from 'lucide-react';

interface Props {
  interviewCreated: boolean;
  candidateName: string;
  jobRole: string;
  resumeName?: string;
}

export default function HowItWorks({ interviewCreated, candidateName, jobRole, resumeName }: Props) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <CardHeader>
        <CardTitle>How It Works</CardTitle>
        <CardDescription>AI analyzes and generates personalized questions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {interviewCreated ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Interview Created Successfully!</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">AI Generated For:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{candidateName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">{jobRole}</span>
                </div>
                {resumeName && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{resumeName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {[ 
              { n: 1, t: 'Candidate Analysis', d: 'AI analyzes role requirements and resume', c: 'blue' },
              { n: 2, t: 'Smart Questions', d: 'Generates behavioral & situational questions', c: 'purple' },
              { n: 3, t: 'Live Evaluation', d: 'Real-time scoring with detailed feedback', c: 'green' },
              { n: 4, t: 'Final Report', d: 'Comprehensive results with recommendations', c: 'orange' }
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full bg-${s.c}-100 dark:bg-${s.c}-900 flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-sm font-bold text-${s.c}-600`}>{s.n}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{s.t}</p>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}