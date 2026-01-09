import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, CheckCircle, FileText, Users2 } from 'lucide-react';

export default function FeaturesGrid() {
  const features = [
    { title: 'AI-Powered', icon: <Sparkles className="h-4 w-4 text-blue-600" />, desc: 'Intelligent question generation based on job requirements' },
    { title: 'Auto Scoring', icon: <CheckCircle className="h-4 w-4 text-green-600" />, desc: 'Automatic evaluation with detailed feedback' },
    { title: 'Resume Analysis', icon: <FileText className="h-4 w-4 text-purple-600" />, desc: 'Extracts skills and experience from uploaded resumes' },
    { title: 'Behavioral Focus', icon: <Users2 className="h-4 w-4 text-orange-600" />, desc: 'Assesses cultural fit and soft skills effectively' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {features.map((f, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {f.icon} {f.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}